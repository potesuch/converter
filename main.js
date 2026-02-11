let active = 0;

function convert(files) {
  if (!files || !files.length) return;

  const box = document.querySelector('.box');
  box.classList.add('is-uploading');
  box.classList.remove('is-success');

  active += files.length;

  Array.from(files).forEach(file => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = file.name.replace(/\.\w+$/, '.png');
          document.body.appendChild(a);
          a.click();
          a.remove();

          active--;
          if (active <= 0) {
            box.classList.remove('is-uploading');
            box.classList.add('is-success');
          }
        }, 'image/png');
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

const box = document.querySelector('.box');
const input = box.querySelector('.box_file');
const drop = box.querySelector('.drop-area');

drop.addEventListener('click', () => input.click());
input.addEventListener('change', e => convert(e.target.files));

['dragover','dragenter'].forEach(ev =>
  box.addEventListener(ev, e => {
    e.preventDefault();
    box.classList.add('is-dragover');
  })
);

['dragleave','dragend','drop'].forEach(ev =>
  box.addEventListener(ev, e => {
    e.preventDefault();
    box.classList.remove('is-dragover');
  })
);

box.addEventListener('drop', e => convert(e.dataTransfer.files));
