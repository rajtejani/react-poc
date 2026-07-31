const express = require("express");

const router = express.Router();

const { printReceipt } = require("../printer/printer");

router.post("/", async (req, res) => {

    try {

        await printReceipt(req.body);

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});

module.exports = router;