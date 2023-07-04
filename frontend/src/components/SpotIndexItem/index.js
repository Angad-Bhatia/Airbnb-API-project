import React from 'react';
import { Link } from 'react-router-dom'

import './SpotIndexItem.css';

function SpotIndexItem ({ spot }) {
    const { city, state, price, avgStarRating, numReviews, previewImage } = spot;
    let stars = avgStarRating;
    if (numReviews < 1) {
        stars = 'New';
    }
    console.log("indexItem, spot:", spot);
    return (
        <Link to={`/spots/${spot.id}`}>
            <li className="spot-li">
                <div className='image-container'>
                    <img className="preview" src={previewImage}></img>
                </div>
                <div className='address-rating'>
                    <p className='address'>{city}, {state}</p>
                    <p className='rating'>
                        <i className="fa-solid fa-star" style={{"color": "#00040a"}}></i>
                        {stars}
                    </p>
                </div>
                <div className="price-container">
                    <p className='price-text'>${price}&nbsp;</p>
                    <p className='night'>night</p>
                </div>
            </li>
        </Link>
    )
}

export default SpotIndexItem;