const fs = require("fs");
const imageInfo = require("imageinfo");
const path = require("path");
const jimp = require('jimp');
const TextToSVG = require('text-to-svg');
const textToSVG = TextToSVG.loadSync();
const images = require('images')
const sharp = require("sharp")


// 基础路径
const imgBasePath = (value) => {
    return path.join(__dirname, value)
};


//获取当前时间
function getNowTime() {
    let date = new Date();
    //年 getFullYear()：四位数字返回年份
    let year = date.getFullYear();  //getFullYear()代替getYear()
    //月 getMonth()：0 ~ 11
    let month = date.getMonth() + 1;
    //日 getDate()：(1 ~ 31)
    let day = date.getDate();
    //时 getHours()：(0 ~ 23)
    let hour = date.getHours();
    //分 getMinutes()： (0 ~ 59)
    let minute = date.getMinutes();
    //秒 getSeconds()：(0 ~ 59)
    let second = date.getSeconds();

    return (
        year
        + '-' + zeroFill(month)
        + '-' + zeroFill(day)
        // + ' ' + zeroFill(hour)
        // + ':' + zeroFill(minute)
        // + ':' + zeroFill(second)
    )
}

// 补 0
function zeroFill(num) {
    return num.toString().padStart(2, "0")
}

let curDate = getNowTime(); // 水印内容

let imgPath = "./images/"; // 原始图片位置

let mark = "format"; // 新的图片存放的文件夹


// 读取文件列表
function readFileList(path, filesList) {
    let files = fs.readdirSync(path);
    files.forEach(function (itm, index) {
        let stat = fs.statSync(path + itm);
        if (stat.isDirectory()) {
            //递归读取文件
            readFileList(path + itm + "/", filesList)
        } else {
            let obj = {}; //定义一个对象存放文件的路径和名字
            obj.path = path; //路径
            obj.filename = itm //名字
            filesList.push(obj);
        }
    })
}

let getFiles = {
    //获取文件夹下的所有文件
    getFileList: function (path) {
        let filesList = [];
        readFileList(path, filesList);
        return filesList;
    },
    //获取文件夹下的所有图片
    getImageFiles: function (path) {
        let imageList = [];
        this.getFileList(path).forEach((item) => {
            let ms = imageInfo(fs.readFileSync(item.path + item.filename));
            ms.mimeType && (imageList.push(item))
        });
        return imageList;
    }
};

//获取文件夹下的所有图片
let photos = getFiles.getImageFiles(imgPath);

// 文字转 svg  ( 使用 svg 语法 )
const attributes = {
    fill: 'red',   // 文字颜色
    // stroke: 'black',// 文字描边颜色
    // 'stroke-width': "1", // 描边线条大小
    // 'fill-width': "1", // 文字线条大小
    // 'stroke-opacity': "1", // 描边透明度
    // 'fill-opacity': "1", // 文字线条透明度
    opacity: "0.5"  // 整体透明度
};
const options = {
    x: 0,
    y: 0,
    fontSize: 50,
    anchor: 'top',
    attributes: attributes,
}
const svgText = textToSVG.getSVG(curDate, options);

// // svg 转图片
// (async () => {
//     await svgToImg.from(svgText).toPng({
//         path: "./logo.png"
//     });
//     // console.log(image); // 有返回值
//
//     // await handleImgJimp('./logo.png')
//     // await handleImgImages('./logo.png')
//     handleImgJimp1('./logo.png')
// })();

//
// console.log(svgText);


/*
*  sharp 可用于代替 svgToImg
*  sharp 如果安装不上, 可以先在终端输入一下两行代码 , 更改为国内源
*  npm config set sharp_binary_host "https://npmmirror.com/mirrors/sharp"
*  npm config set sharp_libvips_binary_host "https://npmmirror.com/mirrors/sharp-libvips"
*  npm install sharp
*
* */

sharp(Buffer.from(svgText))
    .png()
    .toFile("logo.png")
    .then(function (info) {
        console.log(info)
        handleImgJimp1('./logo.png')
    })
    .catch(function (err) {
        console.log(err)
    })

// 测试 jimp
function handleImgJimp(logo) {

    for (let i = 0; i < photos.length; i++) {
        let sourceImgPath = photos[i].path;
        let sourceImgName = photos[i].filename;
        let sourceImg = imgBasePath(sourceImgPath + sourceImgName)

        let sourceImage;
        //读取原图
        jimp.read(sourceImg).then(image => {
            sourceImage = image;
            //加载水印字体
            return jimp.loadFont(jimp.FONT_SANS_64_BLACK);
        }).then(font => {
            // 输出位置
            let position = ''
            if (mark.length > 0) {
                position = imgBasePath("./" + mark + '/' + sourceImgPath + sourceImgName)
            } else {
                position = sourceImg
            }

            // 初始化一个透明度为0的图片
            let textImage = new jimp(sourceImage.bitmap.width, sourceImage.bitmap.height, 0x0);

            // 生成水印 ( 字体 , 位置1 , 位置2 , 文字) 从左上角为起点
            textImage.print(font, 20, 20, images(logo))
                .composite(sourceImage, 0, 0, {
                    mode: jimp.BLEND_MULTIPLY,
                    opacitySource: 1,
                    opacityDest: 0.3
                })
                .write(position)
        })
    }
    console.log("🚀", '完成')
}

// 测试 images
function handleImgImages(logo) {

    let logoMark = images(logo);

    for (let i = 0; i < photos.length; i++) {
        let sourceImgPath = photos[i].path;
        let sourceImgName = photos[i].filename;

        let sourceImg = images(sourceImgPath + sourceImgName);

        let sWidth = sourceImg.width();
        let sHeight = sourceImg.height();

        let wmWidth = logoMark.width();
        let wmHeight = logoMark.height();

        // 输出位置
        let position = ''
        if (mark.length > 0) {

            fs.mkdir(imgBasePath('./' + mark), (err) => {
                if (err) console.error(err);
            });

            let newSourceImgPath = sourceImgPath.slice(1)
            position = images('./' + mark + newSourceImgPath + sourceImgName + '')
        } else {
            position = sourceImg
        }

        images(sourceImg)
            // 设置绘制的坐标位置，右下角距离 10px
            .draw(logoMark, sWidth - wmWidth - 10, sHeight - wmHeight - 10)
            // 保存格式会自动识别
            // .save(sourceImgPath + mark + sourceImgName + '');
            .save('format/' + sourceImgName);
    }
}

// 最终版本
function handleImgJimp1(logoFile) {

    // 水印距离右下角百分比
    const LOGO_MARGIN_PERCENTAGE = 5 / 100;

    // 循环读取每一张图片
    for (let i = 0; i < photos.length; i++) {
        let sourceImgPath = photos[i].path;
        let sourceImgName = photos[i].filename;
        let sourceImg = imgBasePath(sourceImgPath + sourceImgName)
        let LOGO = imgBasePath(logoFile)

        const main = async () => {
            const [image, logo] = await Promise.all([
                jimp.read(sourceImg),
                jimp.read(LOGO)
            ]);

            const xMargin = image.bitmap.width * LOGO_MARGIN_PERCENTAGE;
            const yMargin = image.bitmap.width * LOGO_MARGIN_PERCENTAGE;

            const X = image.bitmap.width - logo.bitmap.width - xMargin;  // x 轴位置
            const Y = image.bitmap.height - logo.bitmap.height - yMargin; // y 轴位置

            return image.composite(logo, X, Y, [
                {
                    // mode: jimp.BLEND_SOURCE_OVER,
                    mode: jimp.BLEND_MULTIPLY,
                    opacitySource: 0.1,
                    opacityDest: 0.1
                }
            ]);
        };
        main().then(image => {
            // const FILENAME = 'new_name.' + image.getExtension();

            // // 压缩图片 0-100
            // image.quality(80);

            // 输出文件位置
            let position = ''
            if (mark.length > 0) {
                position = imgBasePath("./" + mark + '/' + sourceImgPath + sourceImgName)
            } else {
                position = sourceImg
            }

            return image.write(position, (err) => {
                if (err) return console.error(err)

                console.log('添加水印成功 : ', position)
            });
        });
    }
}
