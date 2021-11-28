const getPartyPlan = async (req, res) => {
    try {
        res.json({
            msg: 'Dummy party plan!',
        });
    } catch (error) {
        console.log('An error occurred while getting the party plan', error);
        res.status(500).json({ msg: 'Server Error' });
    }
}

module.exports = {
    getPartyPlan
}