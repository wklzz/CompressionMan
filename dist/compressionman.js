/**
 * CompressionMan
 * 恶魔在路上(blog.wozir.com)
 * version : 0.0.1(170709)
 */

(function($) {

    $.extend({
        compressionMan : function(options) {
            return new CompressionMan(options);
        }
    });

    var CompressionMan = function(options) {
        var me = this;
        me.lock = false;
        me.options = $.extend({
            type : 'width', //width,height,maxSide
            quality : 0.7,//between 0.0 - 1.0
            max : 1300, //max length, unit px
            error : '',
            dataBlob : '',
            dataURL : '',
            befor : '',
            complete : '',
        }, options); 

        var imageContainer = new Image();
        var fileReader = new FileReader();
        var canvasDrawer = document.createElement("canvas");
        var $input;

        me.select = function() {
            if(me.lock) {
                return;
            }
            me.lock = true;
            if(typeof me.options.before == 'function') {
                if(me.options.before() == false) {
                return;   
                }
            }
            $input = $("<input>");
            $input.hide();
            $input.attr("type", "file");
            $input.attr("accept", "image/gif,image/jpeg,image/jpg,image/png,image/svg");
            $input.on("change", afterSelect);
            $input.click();
        };

        function afterSelect() {
            var orientation, fileName = this.files[0].name;
            
            //EXIF js 可以读取图片的元信息  https://github.com/exif-js/exif-js
            EXIF.getData(this.files[0],function(){
                orientation=EXIF.getTag(this,'Orientation');
            });

            fileReader.onload = function(e) {
                imageContainer.onload = function() {
                    if(!this.width || !this.height) {
                        showError("图片格式错误！");
                        return;
                    }

                    var cvWidth = this.width, cvHeight = this.height, degree = 0;
                    var ret = getWidthHeight(cvWidth, cvHeight);
                    canvasDrawer.width = cvWidth = ret[0];
                    canvasDrawer.height = cvHeight = ret[1];


                    //判断图片方向，重置canvas大小，
                    //确定旋转角度，iphone默认的是home键在右方的横屏拍摄方式
                    switch(orientation){
                        //iphone横屏拍摄，此时home键在左侧
                        case 3:
                            degree=180;
                            cvWidth = -cvWidth;
                            cvHeight = -cvHeight;
                            break;
                            //iphone竖屏拍摄，此时home键在下方(正常拿手机的方向)
                        case 6:
                            degree=90;
                            canvasDrawer.width = cvHeight;
                            canvasDrawer.height = cvWidth;
                            cvHeight = -cvHeight;
                            break;
                            //iphone竖屏拍摄，此时home键在上方
                        case 8:
                            degree=270;
                            canvasDrawer.width = cvHeight;
                            canvasDrawer.height = cvWidth;
                            cvWidth = -cvWidth;
                            break;
                    }
                    //使用canvas旋转校正
                    var mycx = canvasDrawer.getContext("2d");
                    mycx.rotate(degree*Math.PI/180);
                    mycx.drawImage(imageContainer, 0, 0, cvWidth, cvHeight);
                    var picture = {};
                    picture.name = fileName; 
                    picture.data = canvasDrawer.toDataURL("image/jpeg", me.options.quality);
                    if(typeof me.options.complete == 'function') {
                        if(me.options.complete() == false) {
                            return;   
                        }
                    }
                    if(typeof me.options.dataURL == 'function') {
                        me.options.dataURL(picture);
                    }
                    if(typeof me.options.dataBlob == 'function') {
                        picture.data = dataURLtoBlob(picture.data);
                        me.options.dataBlob(picture);
                    }
                    me.lock = false;
                }
                imageContainer.src = e.target.result;
            }; 
            fileReader.readAsDataURL(this.files[0]);
        }

        function dataURLtoBlob(dataurl) {
            var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], {type:mime});
        }

        function getWidthHeight(width, height) {
            var ret = new Array();

            switch(me.options.type) {
                case 'width' :
                    if(width > me.options.max) {
                        height = height / width * me.options.max;
                        width = me.options.max;
                    }
                    break;
                case 'height' :
                    if(height > me.options.max) {
                        width = width / height * me.options.max;
                        height = me.options.max;
                    }
                    break;
                default :
                    var maxSide = Math.max(width, height);
                    if (maxSide > me.options.max) {
                        var minSide = Math.min(width, height);
                        minSide = minSide / maxSide * me.options.max;
                        maxSide = me.options.max;
                        if (width > height) {
                            width = maxSide;
                            height = minSide;
                        } else {
                            width = minSide;
                            height = maxSide;
                        }
                    }
            }

            ret[0] = width;
            ret[1] = height;
            return ret;
        }

        function showError(msg) {
            me.lock = false;
            if(typeof me.options.error == 'function') {
                me.options.error(msg); 
            } else {
                alert(msg);
            } 
        }

    }

})(window.Zepto || window.jQuery);
