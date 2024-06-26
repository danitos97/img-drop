class ImgDrop{
    // public

    // config example
    // config = {
    //     target:'target-id',
    //     fileLimit:20, 
    //     featured:true,
    //     maxWidth:1280,     
    //     compression:.75
    // }
    //config = {
    //     target:'target-id',
    //     fileLimit:20, 
    //     fileMode: true,
    //     validFiles: ["pdf","doc"],
    //     maxWidth:1280,     
    //     compression:.75
    // }
    constructor(config){
        
        const self = this;
        const div = document.getElementById(config.target);
        div.classList.add('img-drop');

        const dropArea = document.createElement('div');
        dropArea.classList.add('drop-area','droppable');
        
        const dropH2 = document.createElement('h2');
        config.fileMode = config.validFiles != undefined;
        dropH2.innerHTML=`Arrastra aquí ${config.fileMode?'los archivos':'las imagenes'}`;
        
        dropH2.classList.add('droppable');
        dropArea.appendChild(dropH2);
        
        const dropH3 = document.createElement('h3');
        dropH3.innerHTML = 'También puedes seleccionarlas';
        dropH3.classList.add('droppable');
        dropArea.appendChild(dropH3);
        
        const input = document.createElement('input');
        input.type = 'file';
        input.setAttribute('multiple','');
       
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
        });
        
        document.addEventListener("drop", e => e.preventDefault());
        dropArea.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            self.addFiles(files);
        });
        previewArea.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            self.addFiles(files);
        });
        input.addEventListener('change',() => {
            if(input.files.length > 0) {
                const files = [...input.files];
                self.addFiles(files);
            }
            input.value = '';
        });
        
        this.previewArea = previewArea;
        this.dropArea = dropArea;
        if(config.compression == undefined) 
            config.compression = .75;
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
            let name = urls[i].split('/');
            const file = new File([imgBlob],name[name.length - 1]);
            files.push(file);
        }
        this.addFiles(files);
    }
    
    addFiles(files){
        if(!this.validFiles(files)) {
            alert('Tipo de archivo no valido');
            return;
        }

        if(!this.files.length)
            this.previewArea.innerHTML = '';

        if(!this.config.fileMode){
            this.addImgs(files,0);
            return;
        }
        const nFiles = files.length;
        for(let i = 0; i < nFiles; ++i){
            if(this.limitReach()) break;
            this.createPreview(null, files[i], files[i].size);
        }

        if(this.onchangeFunction)
            this.onchangeFunction();
    }
    limitReach(){
        const limit = this.config.fileLimit;
        const limitReach = this.files.length >= limit
        if(limitReach)
            this.dropArea.append(` Limite de ${limit} archivos alcanzado`);
        return limitReach;
    }
    addImgs(imgs,i){
        const self = this;
        if(self.limitReach()) return;
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxWidth = self.config.maxWidth;
                const maxHeight = self.config.maxHeight;
                const aspect = img.width / img.height;

                if(maxWidth && img.width > maxWidth &&
                  (maxHeight == undefined || maxHeight > maxWidth / aspect)){
                    canvas.width  = maxWidth;
                    canvas.height = maxWidth / aspect;
                }
                else if(maxHeight && img.height > maxHeight){
                    canvas.width  = maxHeight * aspect;
                    canvas.height = maxHeight;
                }
                else{
                    canvas.width = img.width;
                    canvas.height = img.height;
                }

                ctx.drawImage(img, 0, 0, img.width,    img.height,
                                   0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(
                    function(file){
                        self.createPreview(canvas, file, imgs[i].size);
                        if(i < imgs.length - 1)
                            self.addImgs(imgs, i + 1);  

                        else if(self.onchangeFunction)
                            self.onchangeFunction();
                    },
                    "image/jpeg",
                    self.config.compression
                );
            }
            img.src = reader.result;
        }
        reader.readAsDataURL(imgs[i]);
    }

    validFiles(files){
        const imgExt = ['jpg','jpeg','png'];
        const nFiles = files.length;
        for(let i = 0; i < nFiles; ++i){
            const name = files[i].name;
            const ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
            const fileMode = this.config.fileMode;
            if((fileMode && this.config.validFiles.indexOf(ext) === -1) 
                || (!fileMode && imgExt.indexOf(ext) === -1))
                    return false;
        }
        return true;
    }

    setFeatured(i){
        const div = this.previewArea.childNodes[i];
        if(div) div.click();
    }

    createPreview(canvas,original,originalSize){

        const self = this;
        const div = document.createElement('div');
        if(canvas){
            original = new File([original],'img.jpg');
            canvas.classList.add('droppable');
            div.appendChild(canvas);
        }
        else{
            div.innerHTML = `<svg class="file" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path d="M365.3 93.38l-74.63-74.64C278.6 6.742 262.3 0 245.4 0L64-.0001c-35.35 0-64 28.65-64 64l.0065 384c0 35.34 28.65 64 64 64H320c35.2 0 64-28.8 64-64V138.6C384 121.7 377.3 105.4 365.3 93.38zM336 448c0 8.836-7.164 16-16 16H64.02c-8.838 0-16-7.164-16-16L48 64.13c0-8.836 7.164-16 16-16h160L224 128c0 17.67 14.33 32 32 32h79.1V448zM96 280C96 293.3 106.8 304 120 304h144C277.3 304 288 293.3 288 280S277.3 256 264 256h-144C106.8 256 96 266.8 96 280zM264 352h-144C106.8 352 96 362.8 96 376s10.75 24 24 24h144c13.25 0 24-10.75 24-24S277.3 352 264 352z"/>
                </svg>`;
            const nameDiv = document.createElement('div');
            nameDiv.innerHTML = original.name;
            nameDiv.classList.add('name');
            div.classList.add('droppable','file');
            div.appendChild(nameDiv);
        }
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
            if(self.files.length == 0)
                self.previewArea.innerHTML='<h4 class="droppable">No hay imagenes cargadas</h4>';

            if(featuredDeleted){
                if(self.files.length > 0){
                    self.previewArea.querySelector('div').click();
                    self.featuredId = 0;
                }
                else  {
                    self.featuredId = undefined;
                    self.featuredPreview = null;
                }
            }
            else  self.featuredId = self.files.findIndex(file => file == auxFile);
            
            if(this.onchangeFunction)
                self.onchangeFunction();
        })
        div.appendChild(btnDelete);

        if(self.config.featured){
            const btnFeatured = document.createElement('div');
            btnFeatured.classList.add('featured-img');

            btnFeatured.innerHTML = `<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
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
            });
            if(!self.featuredPreview) div.click();  
        }
        const arrow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M504.3 273.6l-112.1 104c-6.992 6.484-17.18 8.218-25.94 4.406c-8.758-3.812-14.42-12.45-14.42-21.1L351.9 288H32C14.33 288 .0002 273.7 .0002 255.1S14.33 224 32 224h319.9l0-72c0-9.547 5.66-18.19 14.42-22c8.754-3.809 18.95-2.075 25.94 4.41l112.1 104C514.6 247.9 514.6 264.1 504.3 273.6z"/>
            </svg>`;
        const sizeInfo = document.createElement('div');
        sizeInfo.classList.add('size-info','droppable');
        originalSize = Math.floor(originalSize / 1024);
        let compressSize = Math.floor(original.size / 1024);
        if(originalSize != compressSize){
            if(originalSize < 1024) originalSize += 'KB';
            else originalSize = (Math.round((originalSize / 1024) * 10) / 10) + 'MB';
            compressSize += 'KB';
            sizeInfo.innerHTML = `<span>${originalSize}</span> ${arrow} <span>${compressSize}</span>`;
        }
        else {
            if(originalSize > 1024)
                 originalSize = (Math.round((originalSize / 1024) * 10) / 10) + 'MB';
            else originalSize += 'KB';
            sizeInfo.innerHTML = `<span>${originalSize}</span>`;
        }
        
        div.appendChild(sizeInfo);

        self.previewArea.appendChild(div);

        self.files.push(original);
    }

    onchange(f){ this.onchangeFunction = f }

}
