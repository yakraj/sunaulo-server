const MapHandler = (db, client) => (req, res) => {
  client
    .placeAutocomplete({
      params: {
        input: req.body.add,
        types: ["establishment", "geocode"],
        components: `country:np`,
        key: "AIzaSyAseuUOwq6TCtLcvozGfqJMGhYyAdEX9tg",
      },
    })
    .then((r) => {
      res.json(r.data);
    })
    .catch((e) => {
      res.status(501).json("unable to get any data");
    });
};

const CreateLocation = (db, st) => (req, res) => {
  const { address, lat, long } = req.body;
  db("geolocation")
    .insert({
      address: address,
      geo: st.geomFromText(`Point(${lat} ${long})`, 4326),
    })
    .then((response) => {
      db.select("*")
        .from("geolocation")
        .then((resp) => {
          res.json(resp);
        });
    })
    .catch((err) => res.status(400).json(err));
};

const Nearby = (db, st) => (req, res) => {
  const { lat, long, r } = req.body;
  db("geolocation")
    .select(
      "address",
      st
        .distance("geo", st.geography(st.makePoint(lat, long)))
        .as("distanceAway")
    )
    .where(st.dwithin("geo", st.geography(st.makePoint(lat, long)), r * 1000))
    .then((response) => res.json(response));
};

const PlaceLatLong = (db, client) => (req, res) => {
  const { placeid } = req.body;

  client
    .placeDetails({
      params: {
        place_id: placeid,
        fields: "geometry",
        key: "AIzaSyAseuUOwq6TCtLcvozGfqJMGhYyAdEX9tg",
      },
      // timeout: 1000, // milliseconds
    })
    .then((r) => {
      res.json(r.data);
    })
    .catch((e) => {
      res.status(501).json("unable to get any data");
    });
};

const LocationDetails = (db, client) => (req, res) => {
  const { latlng } = req.body;

  client
    .reverseGeocode({
      params: {
        latlng: latlng,
        result_type: ["locality", "neighborhood", "park", "ward"],
        key: "AIzaSyAseuUOwq6TCtLcvozGfqJMGhYyAdEX9tg",
      },
      // timeout: 1000, // milliseconds
    })
    .then((r) => {
      res.json(r.data);
    })
    .catch((e) => {
      res.status(501).json("unable to get any data");
    });
};

const AutocompleteDtails = (db, client) => (req, res) => {
  const { place } = req.body;

  client
    .geocode({
      params: {
        address: place,
        fields: "address_components",
        components: `country:np`,
        result_type: ["locality", "neighborhood", "park", "ward"],
        key: "AIzaSyAseuUOwq6TCtLcvozGfqJMGhYyAdEX9tg",
      },
      // timeout: 1000, // milliseconds
    })
    .then((r) => {
      res.json(r.data);
    })
    .catch((e) => {
      res.status(501).json("unable to get any data");
    });
};

module.exports = {
  MapHandler: MapHandler,
  PlaceLatLong: PlaceLatLong,
  CreateLocation: CreateLocation,
  Nearby: Nearby,
  LocationDetails: LocationDetails,
  AutocompleteDtails: AutocompleteDtails,
};
