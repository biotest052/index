
      const canvas = document.getElementById("starfield");
      const ctx = canvas.getContext("2d");

      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);
      let centerX = width / 2;
      let centerY = height / 2;

      const stars = [];
      const numStars = 7500;
      const spread = 2000;

      function lerp(start, end, amt) {
        return start + (end - start) * amt;
      }

      let lastMouseX = null;
      let lastMouseY = null;
      let targetDeltaX = 0;
      let targetDeltaY = 0;
      let deltaX = 0;
      let deltaY = 0;

      window.addEventListener("mousemove", (e) => {
        if (lastMouseX !== null && lastMouseY !== null) {
          targetDeltaX = (e.clientX - lastMouseX) / centerX;
          targetDeltaY = (e.clientY - lastMouseY) / centerY;
        }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      });

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: (Math.random() - 0.5) * spread * 2,
          y: (Math.random() - 0.5) * spread * 2,
          z: (Math.random() - 0.5) * spread * 2,
        });
      }

      function rotateY(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = point.x * cos - point.z * sin;
        const z = point.x * sin + point.z * cos;
        return { x, y: point.y, z };
      }

      function rotateX(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const y = point.y * cos - point.z * sin;
        const z = point.y * sin + point.z * cos;
        return { x: point.x, y, z };
      }

      function project(point) {
        const fov = 500;
        const scale = fov / (fov + point.z);
        return {
          x: centerX + point.x * scale,
          y: centerY + point.y * scale,
          radius: 1.5 * scale,
        };
      }

      function updateStars() {
        deltaX = lerp(deltaX, targetDeltaX, 0.05);
        deltaY = lerp(deltaY, targetDeltaY, 0.05);

        const angleY = deltaX * 0.5;
        const angleX = deltaY * 0.5;

        for (let i = 0; i < stars.length; i++) {
          let star = stars[i];
          star = rotateY(star, angleY);
          star = rotateX(star, angleX);
          stars[i] = star;
        }

        targetDeltaX *= 0.95;
        targetDeltaY *= 0.95;
      }

      function drawStars() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "white";

        for (let star of stars) {
          if (star.z > -250) {
            const projected = project(star);
            if (
              projected.x >= 0 &&
              projected.x < width &&
              projected.y >= 0 &&
              projected.y < height
            ) {
              ctx.beginPath();
              ctx.arc(
                projected.x,
                projected.y,
                projected.radius,
                0,
                2 * Math.PI
              );
              ctx.fill();
            }
          }
        }
      }

      function animate() {
        updateStars();
        drawStars();
        requestAnimationFrame(animate);
      }

      animate();

      window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        centerX = width / 2;
        centerY = height / 2;
      });

      async function loopTitleChange() {
        let names = [
          "b",
          "b",
          "bi",
          "bio",
          "biot",
          "biote",
          "biotes",
          "biotest",
          "biotest0",
          "biotest05",
          "biotest05",
        ];
        let index = 0;
        let forward = true;

        while (true) {
          document.title = names[index];
          await new Promise((resolve) => setTimeout(resolve, 175));

          if (forward) {
            index++;
            if (index === names.length - 1) forward = false;
          } else {
            index--;
            if (index === 0) forward = true;
          }
        }
      }

      loopTitleChange();