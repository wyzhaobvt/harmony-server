const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// need to use function for GET User id or GET team id
// Set up multer for file uploads
//define destination and filename convention
let serverUploadPath =  path.join(__dirname, '../uploads')

if (!fs.existsSync(serverUploadPath)){
    console.log("creating dir")
    fs.mkdirSync(serverUploadPath);
} 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, serverUploadPath);
    },
    filename: function (req, file, cb) { 
        cb(null, file.originalname);
    }
  });
const upload = multer({ storage: storage });

// Serve static files (e.g., uploaded files)
router.use(express.static(path.join(__dirname, '../uploads')));
 
// File upload route
//NOTE: upload.single must be the same as the input element name property
//e.g. <input type="file" name="file">
//3/21/24 will i need to a multiple file upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
    console.log("uploading, ", req.file)
     
    res.json({ filename: req.file.originalname, data: req.file });

});

// File download route
router.get('/download/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, `../uploads/${fileName}`);
  
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).send('Error downloading file');
      }
    }); 
  }); 

//get file names to render on front end
//NOTE 2/28/24: This should be improved to have an res.body.id so that only files that are appropriate
//for that user are returned.
    //MAYBE add dir for specific users and only return files in that dir
    // solution: can add req.params.id => add that like such '/uploads/:id
router.get('/list', async (req, res) => {
    let fileInfo = {};
    let fileProps = [];

    fs.readdir('./uploads', async (err, files) => {
        if(err){
            return console.error("Error!: ", err)
        }
        fileInfo = {files, dirName: 'uploads'}
        
        for(let fileName of files){
            fs.stat(path.join(__dirname, `../uploads/${fileName}`), (err, data) => {
                if(err) throw err;
                fileProps.push(data)
            });
        }
        console.log("file length, ", files.length)
        return res.send(fileInfo)
        if(fileInfo.props === undefined) fileInfo.props = fileProps
        
        if(fileInfo.props){
            console.log("props length, ", fileInfo.props)
        }
        if(fileInfo.props.length === files.length){
            
        }
    })
    
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