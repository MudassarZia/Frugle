/**
 * @author 684171
 */

import { useState } from 'react'
import { Address, Search } from '../components'

export default function Frugle() {
    const [address, setAddress] = useState('')
    const [postalCode, setPostalCode] = useState('')
    const [longitude, setLongitude] = useState('')
    const [latitude, setLatitude] = useState('')
    const [hasValidAddress, setHasValidAddress] = useState(false);

    return (
        <div id="frugle">
            <div id="title">Frugle</div>
               {
                  hasValidAddress
                    ? <Search address={address} postalCode={postalCode} latitude={latitude} longitude={longitude}/>
                    : <Address
                        address={address}
                        setAddress={setAddress}
                        setPostalCode={setPostalCode}
                        setLongitude={setLongitude}
                        setLatitude={setLatitude}
                        setHasValidAddress={setHasValidAddress}
                       />
               }
        </div>
    )
}
