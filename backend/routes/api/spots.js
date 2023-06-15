// backend/routes/api/spots.js
const express = require('express');
const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User, Sequelize } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const Op = Sequelize.Op;

const router = express.Router();

const { Spot, Review, SpotImage, ReviewImage } = require('../../db/models');

const reviewsNum = async id => {
    const count = await Review.count({
        where: {
            spotId: id
        }
    });
    return count
}

//averagerating middleware func
const avgRating = async id => {
    const sum = await Review.sum('stars', {
        where: { spotId: id }
    });

    const total = await reviewsNum(id)
    return sum / total;
}

// GET /api/spots (Get all Spots)
router.get('/', async (req, res) => {
    const allSpots = await Spot.findAll({
        include: [
            {
                model: SpotImage,
                as: 'SpotImages',
                attributes: ['url', 'preview']
            }
        ]
    });
    const response = [];
    let images;
    // console.log(allSpots[0].dataValues.SpotImages);
    for (let i = 0; i < allSpots.length; i++) {
        //reset preview image array
        images = [];
        //convert each spot to POJO
        const spotPojo = allSpots[i].toJSON();
        const newId = allSpots[i].id;
        //assign each spot POJO and avg rating
        spotPojo.avgStarRating = await avgRating(newId);
        //
        const spotImgArr = spotPojo.SpotImages;
        for (let j = 0; j < spotImgArr.length; j++) {
            if (spotImgArr[j].preview) {
                images.push(spotImgArr[j].url);
            }
        }
        if (images.length === 1) spotPojo.previewImage = images[0];
        else if (images.length > 1) spotPojo.previewImage = images;
        else spotPojo.previewImage = 'No preview images available';
        delete spotPojo.SpotImages;
        response.push(spotPojo);
    }

    res.json(response);
});

//GET /api/spots/:spotId/reviews (Get all Reviews by a Spot's id)
router.get('/:spotId/reviews', async (req, res) => {
    const spotReviews = await Spot.findByPk(req.params.spotId, {
        attributes: [],
        include: [
            {
                model: Review,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'firstName', 'lastName']
                    },
                    {
                        model: ReviewImage,
                        as: 'ReviewImages',
                        attributes: ['id', 'url']
                    }
                ]
            }
        ]
    });
    if (!spotReviews) {
        const err = new Error("Spot couldn't be found")
        res.statusCode = 404;
        res.json({ message: err.message });
    }
    res.json(spotReviews);
})

//MUST BE LAST!!!!!!!!!!!! GET /api/spots/:spotId (Get details of a Spot from an id)
router.get('/:spotId', async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId, {
        include: [
            {
                model: SpotImage,
                as: 'SpotImages',
                attributes: ['id', 'url', 'preview']
            },
            {
                model: User,
                as: 'Owner',
                attributes: ['id','firstName', 'lastName']
            }
        ]
    });
    if (!spot) {
        const err = new Error("Spot couldn't be found");
        res.statusCode = 404;
        res.json({ message: err.message });
    }
    const spotObj = spot.toJSON();
    spotObj.numReviews = await reviewsNum(req.params.spotId);
    spotObj.avgStarRating = await avgRating(req.params.spotId);
    const { id, ownerId, address, city, state, country, lat, lng, name, description, price, createdAt, updatedAt, SpotImages, Owner, numReviews, avgStarRating } = spotObj;
    const orderedSpot = { id, ownerId, address, city, state, country, lat, lng, name, description, price, createdAt, updatedAt, numReviews, avgStarRating, SpotImages, Owner };
    res.json(orderedSpot);
});

module.exports = router;