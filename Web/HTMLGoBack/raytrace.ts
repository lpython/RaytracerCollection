// TODO backend url host selector
// TODO expand accepted image format
const LOCALHOST_BACKEND = 'http://localhost:5600/gen_xml.png';
const HEROKU_BACKEND = 'https://guarded-cliffs-71627.herokuapp.com/gen_xml.png';

const AUTO_BACKEND = (function () {
  if (window.location.hostname.includes('localhost')) {
    return LOCALHOST_BACKEND;
  } else {
    return HEROKU_BACKEND;
  }
})();

function onLoad() {
  const par = document.createElement('p');
  document.body.appendChild(par);
  par.appendChild(document.createTextNode('AUTO_BACKEND:' + AUTO_BACKEND));

  const imageElement = <HTMLImageElement>document.querySelector("#ray-img");
  const sceneInput = <HTMLTextAreaElement>document.querySelector('#ray-input');

  // const sceneSelector = <HTMLSelectElement>document.querySelector('#ray-scene');
  const resSelector = <HTMLSelectElement>document.querySelector('#ray-res');

  const elapsedButton = <HTMLInputElement>document.querySelector('#ray-elapsed');
  const renderButton = <HTMLInputElement>document.querySelector('#ray-render');

  sceneInput.value = DefaultXML();
  imageElement.src = transparentImage;

  let outputElapsedTime = (n: number) => {
    elapsedButton.textContent = 'Elapsed : ' + (n / 1000.0).toFixed(2).toString() + 's';

    ['btn-primary', 'btn-success', 'btn-warning', 'btn-danger']
      .forEach(className => { elapsedButton.classList.remove(className); });

    if (n > 2000) {
      elapsedButton.classList.add('btn-danger');
    } else if (n > 500) {
      elapsedButton.classList.add('btn-warning');
    } else {
      elapsedButton.classList.add('btn-success');
    }
  };

  // const resizeRayImage = () => imageElement.height = imageElement.width;

  // sceneInput.addEventListener('mouseup', e => {
  //   // imageElement.style.height = sceneInput.clientHeight.toString() + 'px';
  //   resizeRayImage();
  // });

  renderButton.addEventListener('click', () => {
    let res = parseInt(resSelector.value);
    if (res < 1) {
      res = 256;
    }

    const xml = sceneInput.value;
    const escapedQuery = encodeURI('res=' + res + '&' + 'xml-scene=' + xml);
    const url = AUTO_BACKEND + '?' + escapedQuery;
    const start = performance.now();

    renderCORSRequest(url)
      .then(imageResponeToImageBase64)
      .then(base64 => imageElement.src = base64)
      .then(none => outputElapsedTime(performance.now() - start))
      .catch(console.log)

  });

  // resizeRayImage();
  // resizeTextarea();
}

window.addEventListener('load', onLoad);

function renderCORSRequest(url: string): Promise<Response> {
  return fetch(url, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
    "referrerPolicy": "no-referrer-when-downgrade",
    "body": null,
    "method": "GET",
    "mode": "cors"
  })
}

function imageResponeToImageBase64(res: Response): Promise<string> {
  return res.blob()
    .then(blob => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(<string>reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    });
}

function appendImageResponeToDocument(res: Response) {
  res.blob()
    .then(blob => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(<string>reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    })
    .then(v => {
      let i = document.createElement('img');
      i.src = <string>v;
      console.log(i.src);

      document.body.appendChild(i);
    })
    .catch(err => console.log({ err }));
}

function DefaultXML(): string {
  return `
<scene>
  <camera pos="3.0, 2.0, 4.0" lookAt="-1.0, 0.5, 0.0" />
  <objects>
    <plane normal="0.0,1.0,0.0" offset="0.0" surface="checkerboard" />
    <sphere pos="0.0,1.0,-0.25" size="1.0" surface="shiny"/>
    <sphere pos="-1.0,0.5,1.5" size="0.5" surface="shiny"/>
    <sphere pos="-5.5,2.0,-3.5" size="1.25" surface="checkerboard"/>
  </objects>
  <lights>
    <light pos="-2.0, 2.5, 0.0" color="0.49, 0.07, 0.07" /> 
    <light pos="1.5, 2.5, 1.5" color="0.07, 0.07, 0.49" /> 
    <light pos="1.5, 2.5, -1.5" color="0.07, 0.49, 0.071" /> 
    <light pos="0.0, 3.5, 0.0" color="0.21, 0.21, 0.35" /> 
  </lights>
</scene>
  `.trim();
}

const transparentImage = `
data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAQAAAD2e2DtAAABu0lEQVR42u3SQREAAAzCsOHf9F6oIJXQS07TxQIABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAgAACwAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAAsAEAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAKg9kK0BATSHu+YAAAAASUVORK5CYII=
`.trim();

const gobackPostString = `
res=512&xml-scene=%3Cscene%3E%0D%0A++%3Ccamera+pos%3D%223.0%2C+2.0%2C+4.0%22+lookAt%3D%22-1.0%2C+0.5%2C+0.0%22+%2F%3E%0D%0A++%3Cobjects%3E%0D%0A++++%3Cplane+normal%3D%220.0%2C1.0%2C0.0%22+offset%3D%220.0%22+surface%3D%22checkerboard%22+%2F%3E%0D%0A++++%3Csphere+pos%3D%220.0%2C1.0%2C-0.25%22+size%3D%221.0%22+surface%3D%22shiny%22%2F%3E%0D%0A++++%3Csphere+pos%3D%22-1.0%2C0.5%2C1.5%22+size%3D%220.5%22+surface%3D%22shiny%22%2F%3E%0D%0A++++%3Csphere+pos%3D%22-5.5%2C2.0%2C-3.5%22+size%3D%221.25%22+surface%3D%22checkerboard%22%2F%3E%0D%0A++%3C%2Fobjects%3E%0D%0A++%3Clights%3E%0D%0A++++%3Clight+pos%3D%22-2.0%2C+2.5%2C+0.0%22+color%3D%220.49%2C+0.07%2C+0.07%22+%2F%3E+%0D%0A++++%3Clight+pos%3D%221.5%2C+2.5%2C+1.5%22+color%3D%220.07%2C+0.07%2C+0.49%22+%2F%3E+%0D%0A++++%3Clight+pos%3D%221.5%2C+2.5%2C+-1.5%22+color%3D%220.07%2C+0.49%2C+0.071%22+%2F%3E+%0D%0A++++%3Clight+pos%3D%220.0%2C+3.5%2C+0.0%22+color%3D%220.21%2C+0.21%2C+0.35%22+%2F%3E+%0D%0A++%3C%2Flights%3E%0D%0A%3C%2Fscene%3E
`.trim();