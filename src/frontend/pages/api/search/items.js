/**
 * @author 684171
 */

const Instacart = require('../../../../backend/instacart')

export default async function handler(req, res) {
    if (req.method !== 'POST') res.status(400).json({err: 'Invalid Request Method'})
    if (!req?.body?.guestApiToken ||
        !req?.body?.retailers ||
        !req?.body?.query) return res.status(400).json({err: 'Invalid Request Data'})

    const instacart = new Instacart()
    
    const {guestApiToken, retailers, query} = req.body

    const response = await instacart.searchItems({
        guestApiToken,
        retailers,
        query
    })

    return res.status(200).json(response)
}