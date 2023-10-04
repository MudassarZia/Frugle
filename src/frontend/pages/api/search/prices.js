/**
 * @author 684171
 */

const Instacart = require('../../../../backend/instacart')

export default async function handler(req, res) {
    if (req.method !== 'POST') res.status(400).json({err: 'Invalid Request Method'})
    if (!req?.body?.productIds || !req?.body?.guestApiToken) return res.status(400).json({err: 'Invalid Request Data'})

    const instacart = new Instacart()
    
    const {productIds, guestApiToken} = req.body

    const response = await instacart.searchPrices({
        productIds,
        guestApiToken,
    })

    return res.status(200).json(response)
}