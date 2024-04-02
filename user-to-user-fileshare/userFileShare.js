const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { Console } = require('console');

// need to use function for GET User id or GET team id
// Set up multer for file uploads
//define destination and filename convention
const uploadDir = path.join(__dirname, '../uploads')
router.use('*', (req, res, next) => {
    let chatId = req.params[0].split('/')
    
    req.serverUploadPath = `${uploadDir}/${chatId[2]}`

    if (!fs.existsSync(req.serverUploadPath)){
        fs.mkdirSync(req.serverUploadPath, {recursive: true});
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
    return res.json({ filename: req.file.originalname, data: req.file })
});

// File download route
router.get('/download/:chatId/:fileName', (req, res) => {
    const {chatId, fileName} = req.params;
    const filePath = path.join(__dirname, `../uploads/${chatId}/${fileName}`);
  
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.json({'message':'Error downloading file'});
      } 
    });  
  });

//file copy route
router.post('/:chatId?/:fileName', async (req, res) => {
    const { chatId, fileName } = req.params;
    let cleanName = fileName.split('.')
    const sourcePath = `${uploadDir}/${chatId}/${fileName}`;
    const destPath = `${uploadDir}/${chatId}/${cleanName[0]}[1].${cleanName[1]}`;
    
    fs.access(sourcePath , fs.constants.F_OK, async (err) => {
      if (err) {
        console.log(`This file ${err ? 'does not exist' : 'exists'}`);
      }else {
        console.log("this is not an error", err)
      }
    })
    fsPromises.copyFile(sourcePath, destPath)
        .then((x) => {

            res.json({message: 'File copied successfully!'});
        }) 
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'Something went wrong!'});
        });
})

//file delete route
router.delete('/:chatId?/:fileName', (req, res) => {
    try{
        let {chatId, fileName} = req.params;
        let filePath = path.join(__dirname, `../uploads/${chatId}/${fileName}`);
        
        fs.unlinkSync(filePath)
        return res.json({'message': 'success', 'status': 200})

    } catch(err) {
        console.error(`Server Error ${err}`)
        res.send({'message': `Server Error ${err}`})
    }
})

//get file names route depending on the chatId param
router.get('/list/:chatId', async (req, res) => {
    let fileInfo = {};
    let fileProps = []; 
    let {chatId} =  req.params; 
    
    try{
        let files = fs.readdirSync(`./uploads/${chatId}`, {withFileTypes:true})
        for(let fileName of files){
            let data = fs.statSync(path.join(__dirname, `../uploads/${chatId}/${fileName.name}`));
            fileProps.push(data)
        }
         
        fileInfo = {files, dirName: [`uploads`,`${chatId}`]}
        if(!fileInfo.properties){
            fileInfo = {...fileInfo, properties: fileProps}
        }
        return res.json(fileInfo)
    }catch(err){
        return res.json({error: `error in server ${err}`})
    }
    
});


module.exports = router;

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