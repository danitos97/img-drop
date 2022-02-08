class ImgDrop{
    // public

    // config example
    // config = {
    //     target:'target-id',
    //     fileLimit:20, 
    //     featured:true,
    //     required:true,
    //     maxImgWidth:1280,
    //     maxImgHeight:900
    // }
    constructor(config){
        
        const self = this;
        const div = document.getElementById(config.target);
        div.classList.add('img-drop');

        const dropArea = document.createElement('div');
        dropArea.classList.add('drop-area','droppable');
        
        const dropH2 = document.createElement('h2');
        dropH2.innerHTML = 'Arrastra aquí las imagenes';
        dropH2.classList.add('droppable');
        dropArea.appendChild(dropH2);
        
        const dropH3 = document.createElement('h3');
        dropH3.innerHTML = 'También puedes seleccionarlas';
        dropH3.classList.add('droppable');
        dropArea.appendChild(dropH3);
        
        const input = document.createElement('input');
        input.type = 'file';
        input.setAttribute('multiple','');
        if(config.required)
            input.setAttribute('required','');
        input.classList.add('droppable');
        dropArea.appendChild(input);
        
        div.appendChild(dropArea);
          
        
        const previewArea = document.createElement('div');
        previewArea.classList.add('preview-area','droppable');
        previewArea.innerHTML='<h4 class="droppable">No hay imagenes cargadas</h4>';
        div.append(previewArea);
        
        
        document.addEventListener('dragover', e => {
            let cursor = e.target.classList.contains("droppable")? 'move' : 'none';
            e.dataTransfer.dropEffect = cursor;
            e.preventDefault();
        })
        
        document.addEventListener("drop", e => e.preventDefault());
        dropArea.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            input.files = files;
            self.addImgs(files);
        })
        previewArea.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            input.files = files;
            self.addImgs(files);
        })
        input.addEventListener('change',() => self.addImgs(input.files));
        
        this.previewArea = previewArea;
        this.dropArea = dropArea;
        this.config = config;
        this.input = input;
        this.files = [];
        this.featuredId;
        this.featuredPreview;
        
    }
    async add(urls){
        let files = [];
        for(let i = 0;i < urls.length; i++){
            const imgBlob = await (await fetch(urls[i])).blob();
            // this.createPreview(imgBlob,imgs[i]);
            const file = new File([imgBlob],'img.jpg');
            files.push(file);
        }
        this.addImgs(files);
    }

    addImgs(imgs,i){
        if(!i) i = 0;
        if(this.files.length == 0) this.previewArea.innerHTML = '';
        const limit = this.config.fileLimit;
        if(this.files.length == limit){
            this.dropArea.append(`Limite de ${limit} archivos alcanzado`);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {

            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 300, 300,
                                   0, 0,300,300);
                const resizeImg = canvas.toDataURL(imgs[i].type);
                // this.createPreview(reader.result,imgs[i]);
                this.createPreview(resizeImg,imgs[i]);
                
                if(i < imgs.length - 1)
                    this.addImgs(imgs,i + 1);  

                else if(this.onchangeFunction)
                    this.onchangeFunction();
            }
            img.src = reader.result;
        }
        reader.readAsDataURL(imgs[i])
    }

    setFeatured(i){
        const div = this.previewArea.childNodes[i];
        if(div) div.click();
    }

    createPreview(readerResult,original){
        console.log(readerResult);
        console.log(original);
        const self = this;



        const div = document.createElement('div');
        const img = document.createElement('img');
        img.classList.add('droppable');
        img.src = readerResult;
        div.appendChild(img);
        
        const btnDelete = document.createElement('div');
        btnDelete.classList.add('delete-img-preview','droppable');
        btnDelete.innerHTML = 'X';
        btnDelete.addEventListener('click', e => {
            e.stopPropagation();
            const auxFile = self.files[self.featuredId];;
            // retorna un nuevo arreglo sin el archivo eliminado
            self.files = self.files.filter(value=>{return value != original});
            const featuredDeleted = div == self.featuredPreview;
            
            div.remove();
            
            if(featuredDeleted){
                if(self.files.length > 0){
                    self.previewArea.querySelector('div').click();
                    self.featuredId = 0;
                }
                else self.featuredId = undefined;
            }
            else  self.featuredId = self.files.findIndex(file => file == auxFile);
            
        })
        div.appendChild(btnDelete);

        if(self.config.featured){
            const btnFeatured = document.createElement('div');
            btnFeatured.classList.add('featured-img');

            btnFeatured.innerHTML = `<svg  xmlns="http://www.w3.org/2000/svg">
                    <path d="m32 7 8 17 17 2-12 13 3 18-16-9-16 9 3-18-12-13 17-2z"/>
                    <path d="m32 7l-8 17-17 2 0.832 0.902 16.168-1.902 8-17 8 17 16.168 1.902 0.832-0.902-17-2-8-17zm-13.141 32.848l-2.859 17.152 0.184-0.104 2.816-16.896-0.141-0.152zm26.282 0l-0.141 0.152 2.816 16.896 0.184 0.104-2.859-17.152z"/>
                    <path d="m7.832 26.902-0.832 0.098 11.859 12.848 0.141-0.848zm48.336 0l-11.168 12.098 0.141 0.848 11.859-12.848zm-24.168 21.098-15.816 8.896-0.184 1.104 16-9 16 9-0.184-1.104z"/>
                </svg>`;
            div.appendChild(btnFeatured);

            
            div.addEventListener('click',function(){
                if(this.classList.contains('featured')) return;
                
                if(self.featuredPreview){
                    self.featuredPreview.classList.remove('featured');
                    self.featuredId = self.files.findIndex(file => file == original);
                }
                else self.featuredId = 0;
                this.classList.add('featured');
                self.featuredPreview = this;
                
                if(self.onpreviewclickFunction)
                    self.onpreviewclickFunction();
            })
            if(!self.featuredPreview) div.click();
            
        }
        self.previewArea.appendChild(div);

        self.files.push(original);
    }

    onchange(f){ this.onchangeFunction = f }

//     onpreviewclick(f){ this.onpreviewclickFunction = f}

//     triggerOnchange(){if(this.onchangeFunction) this.onchangeFunction()}
}
