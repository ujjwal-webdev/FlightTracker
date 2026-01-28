const { fetchMonthlyPrices } = require('../services/travelpayoutsService');
const FlightPrice = require('../models/flightPriceModel');

const syncPrices = async (origin, destination) => {
  const results = await fetchMonthlyPrices(origin, destination);

  for (const flight of results) {
    const {
      airline,
      depart_date,
      return_date,
      value,
      currency,
      number_of_changes,
      found_at
    } = flight;    

    // Upsert to avoid duplicates on repeated sync runs.
    // Keyed by route + departure date + airline + transfers.
    await FlightPrice.updateOne(
      {
        origin,
        destination,
        departure_date: depart_date,
        airline: airline || '',
        transfers: number_of_changes,
      },
      {
        $set: {
          origin,
          destination,
          airline: airline || '',
          departure_date: depart_date,
          return_date: return_date || null,
          price: value,
          currency: currency || 'USD',
          transfers: number_of_changes,
          updated_at: found_at ? new Date(found_at) : undefined,
          fetchedAt: new Date(),
        }
      },
      { upsert: true }
    );
  }

  console.log(`Synced prices from ${origin} to ${destination}`);
};

module.exports = syncPrices;
