/**
 * @author 685701
 */

import { useState, useEffect } from 'react'

export default function SearchItem(props) {
    const { name, store, image, onClick, disabled} = props
    const [selected, setSelected] = useState(false)
    const [className, setClassName] = useState('')
    
    const handleClick = () => {
        setSelected(!selected)
        onClick(selected)
    }
    
    useEffect(() => {
        const classType = selected ? 'selected' : disabled ? 'disabled' : 'default'
        setClassName(classType)
    }, [selected, disabled])
        
    return (
        <button id="search-result-option" className={className} onClick={handleClick}>
            <div id="store">{store.name}</div>
            <img src={image}/>
            <div id="name">{name}</div>
        </button>
    )
}