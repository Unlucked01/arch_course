import React, { useState, useEffect } from 'react';
import { TextField, Autocomplete } from '@mui/material';

export default function SearchForm({ onSearch, token }) {
  const [cityFrom, setCityFrom] = useState('');
  const [cityTo, setCityTo] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);

  const [allCities, setAllCities] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/dictionaries/cities`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.ok) {
          const cities = await response.json();
          const uniqueCities = Array.from(new Set(cities.map((city) => city.name)));
          setAllCities(uniqueCities);
        }
      } catch (err) {
        console.error('Error fetching city suggestions:', err);
      }
    };
    fetchCities();
  }, [token]);


  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ cityFrom, cityTo, flightDate, passengerCount });
  };

  return (
    <form onSubmit={handleSubmit} className="card p-3">
      <div className="row justify-content-md-center">
        {/* City From */}
        <div className="col">
          <label>Город отправления</label>
          <Autocomplete
              freeSolo
              options={allCities.filter((city) =>
                  city.toLowerCase().includes(cityFrom.toLowerCase())
              )}
              inputValue={cityFrom}
              onInputChange={(event, value) => setCityFrom(value)}
              renderInput={(params) => <TextField {...params} placeholder="Москва" variant="outlined"/>}
          />
        </div>

        {/* City To */}
        <div className="col">
          <label>Город прибытия</label>
          <Autocomplete
              freeSolo
              options={allCities.filter((city) =>
                  city.toLowerCase().includes(cityTo.toLowerCase())
              )}
              inputValue={cityTo}
              onInputChange={(event, value) => setCityTo(value)}
              renderInput={(params) => <TextField {...params} placeholder="Санкт-Петербург" variant="outlined"/>}
          />
        </div>

        {/* Flight Date */}
        <div className="col">
          <label>Дата</label>
          <TextField
              type="date"
              fullWidth
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              InputLabelProps={{shrink: true}}
          />
        </div>

        {/* Passenger Count */}
        <div className="col">
          <label>Количество пассажиров</label>
          <TextField
              type="number"
              value={passengerCount}
              onChange={(e) => setPassengerCount(e.target.value)}
              inputProps={{min: 1}}
              fullWidth
          />
        </div>

        {/* Submit */}
        <div className="col col-md-auto d-flex align-items-end">
          <button className="btn btn-lg" type="submit">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                 stroke="#000000" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
