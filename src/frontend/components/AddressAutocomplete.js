/**
 * @author 684171
 */

export default function AddressAutocomplete(props) {
    const {onClick, lineOne, lineTwo} = props

    return (
        <div id="autocomplete-address-option-wrapper">
            <button id="autocomplete-address-option" onClick={onClick}>
                <div id="autocomplete-address-data">
                    <div id="line-one">{lineOne}</div>
                    <div id="line-two">{lineTwo}</div>
                </div>
                <svg viewBox="0 0 24 24" fill="#343538" xmlns="http://www.w3.org/2000/svg" size="24"><path fill-rule="evenodd" clip-rule="evenodd" d="M19 9.5c0 3.647-3.931 9.129-5.902 11.647a1.384 1.384 0 01-2.196 0C8.932 18.63 5 13.147 5 9.5a7 7 0 0114 0zm-4.002.105a3 3 0 11-5.996-.21 3 3 0 015.996.21z"></path></svg>
            </button>
        </div>
    )
}