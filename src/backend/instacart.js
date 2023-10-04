const request = require('request')
const zlib = require('zlib')
const {
    v4: uuidv4
} = require('uuid')
const cheerio = require('cheerio')
const fs = require('fs')

class Instacart {
    constructor() {
        // Class constants
        this.USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36'
    }

    /**
     * Decodes brotli encoding, not automatically done so by the request library
     * 
     * @param {string} data - UTF-8 encoded data to be decoded
     */
    decodeBrotliEncoding = (input) => {
        try {
            // Convert data to utf-8
            const data = Buffer.from(input, 'utf-8')

            // Use zlib to decompress brotli
            const decoded = zlib.brotliDecompressSync(data)

            // Convert and return decoded buffer
            return decoded.toString('utf-8')
        } catch (err) {
            return err
        }
    }

    /**
     * Signs up a homepage guest user
     * 
     * @param {Object} args
     * @param {string} args.postalCode - Postal code to get register API token
     * @param {string} args.address - Address to register API token
     * 
     * @returns {string} The guest API token
     */
    signupHomepageGuestUser = ({
            postalCode,
            address
        }) =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = {
                    operationName: "HomepageGuestUser",
                    variables: {
                        "postalCode": postalCode,
                        "streetAddress": address
                    },
                    extensions: {
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "3396660a30136599b441f3408b39212806a2515d345e235e1b4dc2e9e69ff806"
                        }
                    }
                }

                // Build request
                request({
                    url: `https://www.instacart.ca/graphql`,
                    method: 'POST',
                    headers: {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        'origin': 'https://www.instacart.ca',
                        'pragma': 'no-cache',
                        'referer': 'https://www.instacart.ca/',
                        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': this.USER_AGENT,
                        'x-client-identifier': 'web'
                    },
                    body: JSON.stringify(data),
                    encoding: null
                }, (err, res) => {
                    try {
                        if (err) throw new Error(err);
                        else {
                            if (res.statusCode === 200) {
                                // Decode encoding if brotli
                                if (res.headers['content-encoding'] === 'br') res.body = this.decodeBrotliEncoding(res.body)

                                // Parse response body JSON
                                const parsedJSON = JSON.parse(res.body)

                                // Set guest api token to be used for subsequent authenticated API requests
                                const guestApiToken = parsedJSON.data.createGuestUserWithAddress.token

                                return resolve(guestApiToken)
                            } else throw new Error('Unexpected API response status code: ' + res.statusCode)
                        }
                    } catch (err) {
                        console.error(err)
                        return reject(err)
                    }
                })
            } catch (err) {
                console.error(err)
                return reject(err)
            }
        })

    /**
     * Gets session tokens for various retailers
     * 
     * @param {Object} args
     * @param {string} args.guestApiToken - API token derived from registering as a homepage guest user
     * @param {string} args.postalCode - Postal code to derive retailer inventory session tokens
     * @param {string} args.latitude - Latitude to derive retailer inventory session tokens
     * @param {string} args.longitude - Longitude code to derive retailer inventory session tokens
     * 
     * @returns {Array.<{id: string, sessionToken: string}>}
     */
    getRetailerSessionTokens = ({
            guestApiToken,
            postalCode,
            latitude,
            longitude
        }) =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = new URLSearchParams({
                    operationName: "ShopCollection",
                    variables: JSON.stringify({
                        "postalCode": postalCode,
                        "coordinates": {
                            "latitude": parseFloat(latitude),
                            "longitude": parseFloat(longitude)
                        },
                        "addressId": null
                    }),
                    extensions: JSON.stringify({
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "f201763528ab2f63a23fc49bd42f3d9be99b66a514f6124d661b5bbde6ce7820"
                        }
                    })
                })

                // Build request
                request({
                    url: `https://www.instacart.ca/graphql?${data.toString()}`,
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        'pragma': 'no-cache',
                        'referer': 'https://www.instacart.ca/store/s',
                        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': this.USER_AGENT,
                        'x-client-identifier': 'web',
                        'cookie': `__Host-instacart_sid=${guestApiToken}` // API auth cookie
                    },
                    encoding: null
                }, (err, res) => {
                    try {
                        if (err) throw new Error(err);
                        else {
                            if (res.statusCode === 200) {
                                // Decode encoding if brotli
                                if (res.headers['content-encoding'] === 'br') res.body = this.decodeBrotliEncoding(res.body)

                                // Parse response body JSON
                                const parsedJSON = JSON.parse(res.body)

                                const retailerInventorySessionTokens = parsedJSON.data.shopCollection.shops.map((shop) => ({
                                    id: shop.retailer.id,
                                    sessionToken: shop.retailerInventorySessionToken
                                }))

                                return resolve(retailerInventorySessionTokens)
                            } else throw new Error('Unexpected API response status code: ' + res.statusCode)
                        }
                    } catch (err) {
                        console.error(err)
                        return reject(err)
                    }
                })
            } catch (err) {
                console.error(err)
                return reject(err)
            }
        })

    /**
     * Gets available retailers from Instacart API, used to derive products from available stores
     * 
     * @param {Object} args
     * @param {string} args.postalCode - Postal code to get relative available store ids
     * @param {string} args.guestApiToken - API token derived from registering as a homepage guest user
     * 
     * @returns {Array.<{id: string, name: string, type: string}>} Available retailers
     */
    getAvailableRetailServices = ({
            postalCode,
            guestApiToken
        }) =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = new URLSearchParams({
                    operationName: "AvailableRetailerServices",
                    variables: JSON.stringify({
                        "postalCode": postalCode,
                    }),
                    extensions: JSON.stringify({
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "281e876a4bc1aedc1d369cf730d9e4141bd7339c92b9c18d5fde7783134702c5"
                        }
                    })
                })

                // Build request
                request({
                    url: `https://www.instacart.ca/graphql?${data.toString()}`,
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        'pragma': 'no-cache',
                        'referer': 'https://www.instacart.ca/store/s',
                        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': this.USER_AGENT,
                        'x-client-identifier': 'web',
                        'cookie': `__Host-instacart_sid=${guestApiToken}` // API auth cookie
                    },
                    encoding: null
                }, (err, res) => {
                    try {
                        if (err) throw new Error(err);
                        else {
                            if (res.statusCode === 200) {
                                // Decode encoding if brotli
                                if (res.headers['content-encoding'] === 'br') res.body = this.decodeBrotliEncoding(res.body)

                                // Parse response body JSON
                                const parsedJSON = JSON.parse(res.body)

                                // Map response to trimmed non-alcohol available retailer ids
                                const retailers = parsedJSON.data.availableRetailerServices
                                    .filter(({
                                        retailer
                                    }) => retailer.type !== 'Alcohol')
                                    .map(({
                                        retailer
                                    }) => ({
                                        id: retailer.id,
                                        name: retailer.name,
                                        type: retailer.retailerType
                                    }))

                                return resolve(retailers)
                            } else throw new Error('Unexpected API response status code: ' + res.statusCode)
                        }
                    } catch (err) {
                        console.error(err)
                        return reject(err)
                    }
                })
            } catch (err) {
                console.error(err)
                return reject(err)
            }
        })

    /**
     * Gets product matching a search query from a given store
     * 
     * @param {Object} args - Arguments to get product matching search
     * @param {string} args.guestApiToken - API token derived from registering as a homepage guest user
     * @param {string} args.query - Query to search
     * @param {string} args.retailer - Retailer to search
     * 
     * @returns 
     */
    searchQueryInStore = ({
            guestApiToken,
            query,
            retailer
        }) =>
        new Promise((resolve, reject) => {
            try {
                // API parameters
                const data = new URLSearchParams({
                    operationName: "SearchWithClustering",
                    variables: JSON.stringify({
                        "filters": [],
                        "disableReformulation": false,
                        "retailerInventorySessionToken": retailer.sessionToken,
                        "orderBy": "default",
                        "query": query,
                        "pageViewId": uuidv4(),
                        "includeDebugInfo": false,
                        "crossRetailerImpressionId": uuidv4()
                    }),
                    extensions: JSON.stringify({
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "b95bb294f5ca0812857a2db168ecc4b546b4e400d52c4e1a35d55d485242c581"
                        }
                    })
                })

                // Build request
                request({
                    url: `https://www.instacart.ca/graphql?${data.toString()}`,
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        'pragma': 'no-cache',
                        'referer': 'https://www.instacart.ca/store/s',
                        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': this.USER_AGENT,
                        'x-client-identifier': 'web',
                        'cookie': `__Host-instacart_sid=${guestApiToken}` // API auth cookie
                    },
                    encoding: null
                }, (err, res) => {
                    try {
                        if (err) throw new Error(err);
                        else {
                            if (res.statusCode === 200) {
                                // Decode encoding if brotli
                                if (res.headers['content-encoding'] === 'br') res.body = this.decodeBrotliEncoding(res.body)
                                
                                // Parse response body JSON
                                const parsedJSON = JSON.parse(res.body)

                                // Filter out sponsored results, because they're low quality
                                const filtered = parsedJSON.data.searchResults.primaryItemResultList.items.filter(({productId}) => {
                                    return parsedJSON.data.searchResults.primaryItemResultList.featuredProducts.findIndex(featured => featured.productId === productId) === -1
                                })

                                const searchResults = filtered.map(({
                                    name,
                                    legacyId: productId,
                                    viewSection: {
                                        itemImage: {
                                            url: image
                                        }
                                    }
                                }) => ({
                                    name,
                                    retailerId: retailer.id,
                                    productId,
                                    image
                                }))

                                return resolve(searchResults)
                            } else throw new Error('Unexpected API response status code: ' + res.statusCode)
                        }
                    } catch (err) {
                        console.error(err)
                        return reject(err)
                    }
                })
            } catch (err) {
                console.error(err)
                return reject(err)
            }
        })

    /**
     * Gets products matching a search query
     * 
     * @param {Object} args
     * @param {string} args.guestApiToken - API token derived from registering as a homepage guest user
     * @param {string} args.query - Query to search
     * @param {string} args.retailers - Retailers to search
     * 
     * @returns {{products: Array.<{name: string, retailerId: string, productId: string, image: string}>}} - Products matching search & showing results for string
     */
    getProductsMatchingSearch = ({
            guestApiToken,
            query,
            retailers
        }) =>
        new Promise(async (resolve, reject) => {
            try {
                const searchResults = {
                    products: []
                }

                const promises = []
                
                for (const retailer of retailers) {
                    const promise = this.searchQueryInStore({
                        guestApiToken,
                        query,
                        retailer
                    })

                    promises.push(promise)
                }

                Promise.all(promises).then((results) => {
                    results.forEach((result) => searchResults.products.push(...result))
                    return resolve(searchResults)
                })
            } catch (err) {
                console.error(err)
                return reject(err)
            }
        })

    /**
     * Gets up to 20 products' data
     * 
     * @param {Object} args
     * @param {String[]} args.productIds - Array of product ids to derive data
     * @param {string} args.guestApiToken - API token derived from registering as a homepage guest user
     */
     getProductData = ({
        productIds,
        guestApiToken
    }) =>
    new Promise((resolve, reject) => {
        try {
            // API parameters
            const data = new URLSearchParams({
                override_retailer_available_flag: true,
                source: 'web'
            })

            const parsedProductIds = productIds.map(productId => `item_${productId}`).join(',')

            // Build request
            request({
                url: `https://www.instacart.ca/v3/view/item_attributes/${parsedProductIds}?${data.toString()}`,
                method: 'GET',
                headers: {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    'pragma': 'no-cache',
                    'referer': 'https://www.instacart.ca/store/s',
                    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': this.USER_AGENT,
                    'x-client-identifier': 'web',
                    'cookie': `__Host-instacart_sid=${guestApiToken}` // API auth cookie
                },
                encoding: null
            }, (err, res) => {
                try {
                    if (err) throw new Error(err);
                    else {
                        if (res.statusCode === 200) {
                            // Decode encoding if brotli
                            if (res.headers['content-encoding'] === 'br') res.body = this.decodeBrotliEncoding(res.body)

                            // Parse response body JSON
                            const parsedJSON = JSON.parse(res.body)

                            return resolve(parsedJSON.view)
                        } else throw new Error('Unexpected API response status code: ' + res.statusCode)
                    }
                } catch (err) {
                    console.error(err)
                    return reject(err)
                }
            })
        } catch (err) {
            console.error(err)
            return reject(err)
        }
    })

    register = async ({
        postalCode,
        address,
        latitude,
        longitude
    }) => {
        const guestApiToken = await this.signupHomepageGuestUser({
            postalCode,
            address
        })
        const retailerInfo = await this.getAvailableRetailServices({
            postalCode,
            guestApiToken
        })
        const retailerSessionTokens = await this.getRetailerSessionTokens({
            postalCode,
            guestApiToken,
            latitude,
            longitude
        })
        const retailers = []

        // Concatenate retailer info and retailer sesion tokens
        retailerInfo.forEach((retailer) => {
            const i = retailerSessionTokens.findIndex(({
                id
            }) => id === retailer.id)

            if (i > 0) {
                retailers.push({
                    ...retailer,
                    ...retailerSessionTokens[i]
                })
            }
        })

        return {
            guestApiToken,
            retailers
        }
    }

    searchItems = async ({
        guestApiToken,
        retailers,
        query
    }) => {
        const searchResult = await this.getProductsMatchingSearch({
            guestApiToken,
            retailers,
            query
        })

        /**
         * Log data to be sold
         * 
         * IO is always a bottleneck, this will slow down the application a lot
         */
        const SEARCH_LOG_FILE_PATH = './search-logs.json'
        const data = {
            guestApiToken,
            query,
            timestamp: new Date().toISOString()
        }

        const log = {
            data: [data]
        }

        if (fs.existsSync(SEARCH_LOG_FILE_PATH)) {
            log.data = [
                ...JSON.parse(fs.readFileSync(SEARCH_LOG_FILE_PATH)).data,
                ...log.data
            ]
        }

        fs.writeFileSync(SEARCH_LOG_FILE_PATH, JSON.stringify(log), {
            encoding: 'utf-8'
        })

        return searchResult
    }

    searchPrices = async ({
        productIds,
        guestApiToken
    }) => {
        const productData = await this.getProductData({
            productIds,
            guestApiToken
        })

        return productData
    }

}

// const main = async _ => {
//     const instacart = new Instacart()

//     const address = '123 Pickering Street'
//     const postalCode = 'M4E3J5'
//     const latitude = '43.6830359'
//     const longitude = '-79.290861'
//     const query = 'potato'

//     const {
//         guestApiToken,
//         retailers
//     } = await instacart.register({
//         postalCode,
//         address,
//         latitude,
//         longitude
//     })

//     await instacart.searchQueryInStore({
//         guestApiToken,
//         query,
//         retailerSessionToken: retailers[0].sessionToken
//     })
// }

// main()
module.exports = Instacart