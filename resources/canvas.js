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