const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

//need to add a remove chat directory for when chats get deleted
// need to use function for GET User id or GET team id
// Set up multer for file uploads
//define destination and filename convention
const uploadDir = path.join(__dirname, '../uploads')
router.use('*', (req, res, next) => {
    let chatId = req.params[0].split('/')
    if(chatId[2].length > 4){
        next();
    } else{
        req.serverUploadPath = `${uploadDir}/${chatId[2]}`

        if (!fs.existsSync(req.serverUploadPath)){
            fs.mkdirSync(req.serverUploadPath, {recursive: true});
        }
    }
    next();
})
 
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        cb(null, req.serverUploadPath);
    },
    filename: function (req, file, cb) { 
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });
 
// File upload route
//NOTE: upload.single must be the same as the input element name property
//e.g. <input type="file" name="file">
//3/21/24 will i need to a multiple file upload endpoint
router.post('/upload/:chatId', upload.single('file'), (req, res) => {
    return res.json({ 'filename': req.file.originalname, 'data': req.file })
});


// File download route
router.get('/download/:chatId/:fileName', async (req, res) => {
    const {chatId, fileName} = req.params;
    const filePath =  `${uploadDir}/${chatId}/${fileName}`;
    console.log(filePath, fileName)
  
    try {
        fs.access(filePath, fs.constants.F_OK, (err) => {if(err) console.error("error accessing: ",err)});
        res.download(filePath, fileName, (err) => {if(err)console.error("error downloading: ",err)});
    } catch (error) {
        console.error(`Failed to download file: ${error}`);
        res.status(404).send('File not found');
    }
  });

//file duplicate route
router.post('/:chatId?/:fileName', async (req, res) => {
    const { chatId, fileName } = req.params;
    const sourcePath = `${uploadDir}/${chatId}/${fileName}`;
    let destPath;

    //regex targets comma, period and square bracket
    let cleanName = cleanFileName(fileName)
    //scan directory for files
    let chatDir = fs.readdirSync(`${uploadDir}/${chatId}`);
    //finds amount of file copies in directory
    let fileCopyCount = chatDir.filter(file => file.match(cleanName[0]));
    let latestCopy = cleanFileName(fileCopyCount[fileCopyCount.length - 1]);
    let fileCopyValue = Number(latestCopy[1]) + 1;

    if(latestCopy.length === 2 && cleanName.length === 2){
        //if you click on a root file with no copies
        destPath = `${uploadDir}/${chatId}/${cleanName[0]}[1].${cleanName[1]}`;
        fs.copyFileSync(sourcePath, destPath)
    }else if(cleanName.length === 2 && cleanName[1].length > 1){
        //if you click on root file that already has copies
        destPath = `${uploadDir}/${chatId}/${cleanName[0]}[${fileCopyValue}].${cleanName[1]}`;
        fs.copyFileSync(sourcePath, destPath)
    }else if(cleanName.length > 2){
        //if you click duplicate on the root file that already has copies
        destPath = `${uploadDir}/${chatId}/${cleanName[0]}[${fileCopyValue}].${cleanName[3]}`;
        fs.copyFileSync(sourcePath, destPath)
    }
    return res.json({'status': 200, 'message': 'Copy success', 'file': fileName})
})

//file delete route
router.delete('/:chatId?/:fileName', (req, res) => {
    try{
        let {chatId, fileName} = req.params;
        let filePath = `${uploadDir}/${chatId}/${fileName}`;
        
        fs.unlinkSync(filePath);
        return res.json({'message': 'success', 'status': 200})

    } catch(err) {
        console.error(`Server Error ${err}`);
        return res.send({'message': `Server Error ${err}`});
    }
})

//get file names route depending on the chatId param
router.get('/list/:chatId', async (req, res) => {
    let fileInfo = {};
    let fileProps = []; 
    let {chatId} =  req.params; 
    
    try{
        let files = fs.readdirSync(`./uploads/${chatId}`, {withFileTypes:true});
        for(let fileName of files){
            let data = fs.statSync(path.join(__dirname, `../uploads/${chatId}/${fileName.name}`));
            fileProps.push(data)
        }
         
        fileInfo = {files, dirName: [`uploads`,`${chatId}`]}
        if(!fileInfo.properties){
            fileInfo = {...fileInfo, properties: fileProps};
        }
        return res.json(fileInfo)
    }catch(err){
        return res.json({'error': `error in server ${err}`})
    }
    
});


module.exports = router;
 
function cleanFileName(dir){
    return dir.split( /[\,\.\[\]]/g);
}
 
/*
This is how the front end code should look like for fetching file list and downloading and uploading files
Use this as a guideline

fetchFileList fetches list of files in a directory
async function fetchFileList() {
    try {
        const response = await fetch('http://localhost:5000/files/list');
        const data = await response.json();
        return data.files;
    } catch (error) {
        console.error('Error fetching file list:', error);
        throw error; // Propagate the error
    }
}

fetchFileContent triggers a download of a specific file name
async function fetchFileContent(fileName) {
    try {
        const response = await fetch(`http://localhost:5000/files/download/${fileName}`);
        return await response.blob();
    } catch (error) {
        console.error(`Error fetching content for ${fileName}:`, error);
        throw error; // Propagate the error
    }
}

createFileLink creates a list of files using the fetchFileList function to get the list
function createFileLink(fileName, fileBlob) {
    const fileUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.textContent = fileName;
    link.href = fileUrl;
    link.download = fileName;
    const listItem = document.createElement('li');
    listItem.appendChild(link);
    return listItem;
}

displayFiles renders all the file links
async function displayFiles() {
    try {
        const fileNames = await fetchFileList();
        const fileList = document.getElementById('fileList');
        
        // Fetch file content and create links concurrently
        const filePromises = fileNames.map(async fileName => {
        const fileBlob = await fetchFileContent(fileName);
        return createFileLink(fileName, fileBlob);
        });

        // Wait for all file links to be created
        const fileLinks = await Promise.all(filePromises);

        // Append file links to the file list
        fileLinks.forEach(link => fileList.appendChild(link));
    } catch (error) {
    console.error('Error displaying files:', error);
    }
}

// Call the function to display files
displayFiles();


Here's the html: 
<form action="http://localhost:5000/files/upload" enctype="multipart/form-data" method="post">
        <div class="form-group">
          <input type="file" class="form-control-file" name="file">
          <input type="submit" value="Upload file!" class="btn btn-default">            
        </div>
    </form>
    <ul id="fileList">
    </ul>
</form>

*/