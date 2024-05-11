const express = require('express')
const router = express.Router()
const fs = require('fs')
const geoip = require('geoip-lite')

const regionsEnum = {
    XX: "Unknown",
    NA: "North America",
    EU: "Europe",
    AS: "Asia",
    SA: "South America",
    OC: "Oceania"
}

function validateFriendCode(inputString) {
    // Define the regular expression pattern
    const pattern = /^[A-Z0-9]{5}-[A-Z0-9]{4}$/;

    // Check if the inputString matches the pattern
    if (pattern.test(inputString)) {
        return true; // String is valid
    } else {
        return false; // String is not valid
    }
}

function readJSONFile(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return null;
    }
}

function writeJSONFile(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing JSON file:', error);
    }
}

function addItemToArray(filename, arrayName, item) {
    const jsonData = readJSONFile(filename);
    if (jsonData && Array.isArray(jsonData[arrayName])) {
        jsonData[arrayName].push(item);
        writeJSONFile(filename, jsonData);
    } else {
        console.error('Array not found in JSON file or data is not an array.');
    }
}

function removeItemByField(filename, arrayName, fieldName, fieldValue) {
    const jsonData = readJSONFile(filename);
    if (jsonData && Array.isArray(jsonData[arrayName])) {
        const indexToRemove = jsonData[arrayName].findIndex(item => item[fieldName] === fieldValue);
        if (indexToRemove !== -1) {
            jsonData[arrayName].splice(indexToRemove, 1);
            writeJSONFile(filename, jsonData);
        } else {
            console.error('Item not found in the array.');
        }
    } else {
        console.error('Array not found in JSON file or data is not an array.');
    }
}


router.get( '/matchmaking', async (req, res) => {
    let codes
    try {
        const codesJson = fs.readFileSync('./codes.json', 'utf8')
        codes = JSON.parse(codesJson)
    } catch(error) {
        codes = {codes: []}
    }

    res.status(200).send(codes.codes)
})


router.post( '/matchmaking', async (req, res) => {
    try {
        const body = req.body

        const codesFile = readJSONFile('./codes.json')
        const foundCode = codesFile.codes.find( c => c.friendCode === body.friendCode )
        if(foundCode) {
            return res.status(200).send({
                error: "You have already submitted a friend code recently - please wait for it to expire before trying again."
            })
        }

        if( !validateFriendCode(body.friendCode) ) {
            return res.status(200).send({
                error: "Your friend code looks like this: AB1DE-F3HI"
            })
        }

        const clientIp = req.clientIp
        const geo = geoip.lookup(clientIp)
        let newRegion
        if (geo && geo.region) {
            const countryCode = geo.region.toUpperCase()
            newRegion = countryCode
        } else {
            newRegion = "XX"
        }

        const newCode = {...body, time: Date.now(), region: newRegion}

        addItemToArray('./codes.json', "codes", newCode)

        res.status(200).send(newCode)
    } catch (err) {
        res.status(404).send({message: err.message})
    }

})


module.exports = router


setInterval( () => {
    const codesFile = readJSONFile('./codes.json')
    codesFile.codes.forEach( code => {
        console.log(Date.now() - code.time )
        if( Date.now() - code.time > 1800000 ) {
            removeItemByField('./codes.json', "codes", "friendCode", code.friendCode)
        }
    } )
}, 300000 )