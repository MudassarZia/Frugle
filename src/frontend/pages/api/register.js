/**
 * @author 684171
 */

const Instacart = require('../../../backend/instacart')

export default async function handler(req, res) {
    if (req.method !== 'POST') res.status(400).json({err: 'Invalid Request Method'})
    if (!req?.body?.address ||
        !req?.body?.postalCode ||
        !req?.body?.latitude ||
        !req?.body?.longitude) return res.status(400).json({err: 'Invalid Request Data'})

    const instacart = new Instacart()
    
    const {address, postalCode, latitude, longitude} = req.body

    const response = await instacart.register({
        address,
        postalCode,
        latitude,
        longitude
    })

    return res.status(200).json(response)
}