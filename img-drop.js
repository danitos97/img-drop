

// const $=id=>{const e=document.querySelectorAll(id);return e.length==1?e[0]:e.length==0?null:[...e]}
// EventTarget.prototype.on = EventTarget.prototype.addEventListener;
// EventTarget.prototype.forEach = function(f){f(this)};
// Array.prototype.on = function(ev,f){this.forEach(e=>{e.on(ev,f)})}
// const create = tag=>document.createElement(tag);

class ImgDrop{
    
    constructor(config){
        
        const self = this
        const div = document.getElementById(config.target)
        div.classList.add('img-drop')

        const dropArea = document.createElement('div')
        dropArea.classList.add('drop-area','droppable')
        
        const dropH2 = document.createElement('h2')
        dropH2.innerHTML = 'Arrastra aquí las imagenes'
        dropH2.classList.add('droppable')
        dropArea.appendChild(dropH2);
        
        const dropH3 = document.createElement('h3')
        dropH3.innerHTML = 'También puedes seleccionarlas'
        dropH3.classList.add('droppable')
        dropArea.appendChild(dropH3)
        
        const input = document.createElement('input')
        input.type = 'file'
        input.setAttribute('multiple','')
        input.classList.add('droppable')
        dropArea.appendChild(input)
        
        div.appendChild(dropArea)
          
        
        const previewArea = document.createElement('div')
        previewArea.classList.add('preview-area','droppable')
        previewArea.innerHTML='<h4 class="droppable">No hay imagenes cargadas</h4>'
        div.append(previewArea)
        
        
        document.addEventListener('dragover', e => {
            let cursor = e.target.classList.contains("droppable")? 'move' : 'none';
            e.dataTransfer.dropEffect = cursor
            e.preventDefault()
        })
        
        document.addEventListener("drop", e => e.preventDefault())
        dropArea.addEventListener('drop', e => {
            const files = e.dataTransfer.files
            input.files = files
            self.addImgs(files)
        })
        previewArea.addEventListener('drop', e => {
            const files = e.dataTransfer.files
            input.files = files
            self.addImgs(files)
        })
        input.addEventListener('change',() => self.addImgs(input.files))
        
        this.previewArea = previewArea
        this.dropArea = dropArea
        this.config = config
        // this.nImgs = 0
        this.files = []
        
    }
  
    addImgs(imgs,i){
        if(!i) i = 0;
        if(this.files.length == 0) this.previewArea.innerHTML = ''
        const limit = this.config.fileLimit
        if(this.files.length == limit){
            this.dropArea.append(`Limite de ${limit} archivos alcanzado`)
            return;
        }
        const reader = new FileReader()
        reader.onload = () => {
            const div = document.createElement('div')

            const img = document.createElement('img')
            img.src = reader.result
            div.appendChild(img)

            const btnDelete = document.createElement('div')
            btnDelete.classList.add('delete-img-preview')
            btnDelete.innerHTML = 'X'
            btnDelete.addEventListener('click', () => {
                div.remove()
                this.files = this.files.filter(value => {
                    return value != imgs[i]
                })
            })

            div.appendChild(btnDelete)
        
            this.previewArea.appendChild(div)
            this.files.push(imgs[i])
            if(i < imgs.length - 1)
                this.addImgs(imgs,i + 1)
            // else console.log(this.files)
        }
        reader.readAsDataURL(imgs[i])
    }

}
// const dropArea
// $('.drag-drop').innerHTML = `
//     <section id="subir-imagen">
//     <h2>Arrastra aquí las imagenes de la nota.</h2><br>
//     <h3>Tambien puedes seleccionarlas.</h3>
//     <input type="file" id="img-input" name="img-input" multiple>
//     </section><br><br>
//     <h3 class="trapecio">Imagenes</h3><br>
//     <section id="img-cargadas"><h4>No hay imagenes cargadas</h4></section>`
