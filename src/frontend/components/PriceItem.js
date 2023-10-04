/**
 * @author 685701
 */

export default function PriceItem(props) {
    const { name, store, image, price, rank, productId } = props

    const onClick = () => {
        window.location.href = `https://www.instacart.ca/store/items/item_${productId}`
    }

    return (
        <button id="price-result-option" onClick={onClick}>
            <div id="store-rank">
                <div id="rank" rank={rank}>#{rank}</div>
                <div id="store">{store.name}</div>
            </div>
            <img src={image}/>
            <div id="name">{name}</div>
            <div id="price">{price}</div>
        </button>
    )
}