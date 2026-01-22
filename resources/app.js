const FOREGROUND = "#50FF00";
const GRID_FOREGROUND = "#F0F0F0";
const BACKGROUND = "#112233";

const FPS = 60;
const NEAR = 0.05;

const GRAVITY = -9.8;
const FLOOR_Y = -1;
const CUBE_COUNT = 50;

const canvas = document.getElementById("canvas");
canvas.width = Math.max(
    document.documentElement.clientWidth,
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth
);
canvas.height = Math.max(
    document.documentElement.clientHeight,
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
);
const ctx = canvas.getContext("2d");

function clear() {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function line2D(p1, p2, c = FOREGROUND) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = c;
    ctx.stroke();
}

function screen(p) {
    return {
        x: (p.x + 1) * 0.5 * canvas.width,
        y: (1 - (p.y + 1) * 0.5) * canvas.height,
    };
}

function project({ x, y, z }) {
    if (z <= NEAR) return null;
    const fov = 0.75;
    const aspect = canvas.width / canvas.height;
    return {
        x: (x / z) * fov / aspect,
        y: (y / z) * fov,
    };
}

function line3D(a, b, c = FOREGROUND) {
    const pa = project(a);
    const pb = project(b);
    if (!pa || !pb) return;
    line2D(screen(pa), screen(pb), c);
}

const vs = [
    { x:  0.5, y:  0.5, z:  0.5 },
    { x: -0.5, y:  0.5, z:  0.5 },
    { x: -0.5, y: -0.5, z:  0.5 },
    { x:  0.5, y: -0.5, z:  0.5 },
    { x:  0.5, y:  0.5, z: -0.5 },
    { x: -0.5, y:  0.5, z: -0.5 },
    { x: -0.5, y: -0.5, z: -0.5 },
    { x:  0.5, y: -0.5, z: -0.5 },
];

const edges = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
];

let physicsWorld;
let rigidBodies = [];

Ammo().then((AmmoLib) => {
    const collisionConfig = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfig);
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfig);
    physicsWorld.setGravity(new Ammo.btVector3(0, GRAVITY, 0));

    const floorShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 0.5, 50));
    const floorTransform = new Ammo.btTransform();
    floorTransform.setIdentity();
    floorTransform.setOrigin(new Ammo.btVector3(0, FLOOR_Y - 0.5, 25));
    const floorMotionState = new Ammo.btDefaultMotionState(floorTransform);
    const floorRbInfo = new Ammo.btRigidBodyConstructionInfo(0, floorMotionState, floorShape, new Ammo.btVector3(0,0,0));
    const floorBody = new Ammo.btRigidBody(floorRbInfo);
    physicsWorld.addRigidBody(floorBody);

    for (let i = 0; i < CUBE_COUNT; i++) {
        const size = 1;
        const shape = new Ammo.btBoxShape(new Ammo.btVector3(size/2, size/2, size/2));
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(
            (Math.random() - 0.5) * 6,
            Math.random() * 4 + 2,
            Math.random() * 6 + 3
        ));
        const quat = new Ammo.btQuaternion(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
            1
        );
        quat.normalize();
        transform.setRotation(quat);

        const mass = 1;
        const localInertia = new Ammo.btVector3(0,0,0);
        shape.calculateLocalInertia(mass, localInertia);

        const motionState = new Ammo.btDefaultMotionState(transform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);

        physicsWorld.addRigidBody(body);
        rigidBodies.push({ body, size });
    }

    requestAnimationFrame(frame);
});

function transformVertex(v, origin, quat, scale) {
    const x = v.x * scale;
    const y = v.y * scale;
    const z = v.z * scale;

    const qx = quat.x(), qy = quat.y(), qz = quat.z(), qw = quat.w();

    const ix =  qw*x + qy*z - qz*y;
    const iy =  qw*y + qz*x - qx*z;
    const iz =  qw*z + qx*y - qy*x;
    const iw = -qx*x - qy*y - qz*z;

    return {
        x: ix*qw + iw*-qx + iy*-qz - iz*-qy + origin.x(),
        y: iy*qw + iw*-qy + iz*-qx - ix*-qz + origin.y(),
        z: iz*qw + iw*-qz + ix*-qy - iy*-qx + origin.z()
    };
}

function drawCube(body, size) {
    const transform = new Ammo.btTransform();
    body.getMotionState().getWorldTransform(transform);
    const origin = transform.getOrigin();
    const rotation = transform.getRotation();

    for (const e of edges) {
        for (let i = 0; i < e.length; i++) {
            const a = transformVertex(vs[e[i]], origin, rotation, size);
            const b = transformVertex(vs[e[(i + 1) % e.length]], origin, rotation, size);
            line3D(a, b);
        }
    }
}

function drawFloorGrid() {
    const size = 50;
    const step = 1;
    const zFar = 50;

    for (let x = -size; x <= size; x += step)
        line3D({ x, y: FLOOR_Y, z: NEAR }, { x, y: FLOOR_Y, z: zFar }, GRID_FOREGROUND);

    for (let z = NEAR; z <= zFar; z += step)
        line3D({ x: -size, y: FLOOR_Y, z }, { x: size, y: FLOOR_Y, z }, GRID_FOREGROUND);
}

function allCubesStopped(rigidBodies, threshold = 0.05) {
    return rigidBodies.every(rb => {
        const vel = rb.body.getLinearVelocity();
        return Math.abs(vel.x()) < threshold &&
                Math.abs(vel.y()) < threshold &&
                Math.abs(vel.z()) < threshold;
    });
}

function kickCubes(rigidBodies) {
    for (const rb of rigidBodies) {
        const vx = (Math.random() - 0.5) * 4;
        const vy = Math.random() * 4 + 2;
        const vz = (Math.random() - 0.5) * 4;
        rb.body.setLinearVelocity(new Ammo.btVector3(vx, vy, vz));
        rb.body.setAngularVelocity(new Ammo.btVector3(vz, vy, vx));
    }
}

function frame() {
    clear();
    drawFloorGrid();

    const dt = 1 / FPS;
    if (physicsWorld) physicsWorld.stepSimulation(dt, 10);

    if (allCubesStopped(rigidBodies)) {
        kickCubes(rigidBodies);
    }

    for (const rb of rigidBodies) {
        drawCube(rb.body, rb.size);
    }

    requestAnimationFrame(frame);
}