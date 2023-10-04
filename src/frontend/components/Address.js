/**
 * @author 684171
 */

import axios from 'axios'
import { useState, useEffect } from 'react'
import AddressAutocomplete from './AddressAutocomplete'

export default function Address(props) {    
    const { address, setAddress, setPostalCode, setLatitude, setLongitude, setHasValidAddress } = props
    const [autocompletes, setAutocompletes] = useState([])
    const [inputDisabled, setInputDisabled] = useState(false)

    const getAutocompleteAddresses = async () => {
        if (address.length <= 1) {
            setAutocompletes([])
            return
        }

        const params = {
            operationName: 'AddressModalAutoCompleteLocations',
            variables: {
                query: address
            },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: "c0c5156ea46d3134127c0a0fe9e4feef1b7956630fb91911f041350a8aefcced"
                }
            }
        }
    
        const { data } = await axios.get('https://www.instacart.ca/graphql', {params})
                
        const autocompletes = data.data.autocompleteLocations.locations.map(({
            postalCode,
            viewSection,
            coordinates
        }) => ({
            lineOne: viewSection.lineOneString,
            lineTwo: viewSection.lineTwoString,
            postalCode,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
        }))

        setAutocompletes(autocompletes)
    }

    useEffect(() => {
        getAutocompleteAddresses()
    }, [address])

    const onAutocompleteAddressClick = (address, postalCode, latitude, longitude) => {
        setInputDisabled(true)
        setAddress(address)
        setPostalCode(postalCode)
        setLatitude(latitude)
        setLongitude(longitude)
        setHasValidAddress(true)
    }

    return (
        <div id="container">
            <div id="border-shadow-wrapper">
                <div id="address">
                    <input type="text" disabled={inputDisabled} placeholder="Enter Your Address" value={address} onChange={(e) => setAddress(e.target.value)}/>
                    <button id="address-icon" type="submit" disabled={true}/>
                </div>
                {
                    autocompletes.length > 0 &&
                        <div id="autocomplete-address-box">
                        {
                            autocompletes.map(({lineOne, lineTwo, postalCode, latitude, longitude}) => 
                                <AddressAutocomplete
                                    key={lineOne + lineTwo + postalCode}
                                    onClick={() => onAutocompleteAddressClick(lineOne, postalCode, latitude, longitude)}
                                    lineOne={lineOne}
                                    lineTwo={lineTwo}
                                    postalCode={postalCode}
                                />
                            )
                        }
                    </div>
                }
            </div>
        </div>
    )
}