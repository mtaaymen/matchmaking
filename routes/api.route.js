const express = require('express')
const router = express.Router()
const fs = require('fs')

router.get( '/matchmaking', async (req, res) => {

    let codes
    try {
        const codesJson = fs.readFileSync('./codes.json', 'utf8')
        codes = JSON.parse(codesJson)
    } catch(error) {
        codes = []
    }
    
    const newCodes = []
    for await( const code of codes ) {
        if(!code?.user?.steamid)  continue

        let userError
        const steamUser = await fetch(`https://steamcommunity.com/actions/ajaxresolveusers?steamids=${code.user.steamid}`)
            .then( res => res.json() )
            .catch( err => {
                console.log(err)
                userError = true
            } )

        console.log(steamUser)

        if( userError || !steamUser?.length ) continue


        const newTime = new Date(code.time)

        newCodes.push({
            ...code,
            user: steamUser[0],
            time: newTime.getTime()
        })
    }

    console.log('newCodes:', newCodes)

    res.status(200).send(newCodes)
})



module.exports = router