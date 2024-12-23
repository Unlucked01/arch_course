import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { TextField, Autocomplete } from '@mui/material';

function AdminFlights({ token }) {
  const [allFlights, setAllFlights] = useState([]);
  const [displayedFlights, setDisplayedFlights] = useState([]);
  const [hasMoreFlights, setHasMoreFlights] = useState(false);

  const [allCities, setAllCities] = useState([]);

  const [newFlight, setNewFlight] = useState({
    flight_id: '',
    from: '',
    to: '',
    date: '',
    price: 0,
    passenger_count: 0,
  });

  const [alertMessage, setAlertMessage] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (token) {
      fetchFlights();
      fetchCities();
    }
  }, [token]);

  const fetchFlights = async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/dictionaries/flights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        throw new Error('Ошибка при загрузке рейсов');
      }
      const data = await resp.json();
      setAllFlights(data);

      const firstChunk = data.slice(0, 5);
      setDisplayedFlights(firstChunk);
      setHasMoreFlights(data.length > 5);

      let maxIdNum = 0;
      data.forEach((f) => {
        const numStr = f.flight_id.replace('FL', '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxIdNum) {
          maxIdNum = num;
        }
      });
      const nextId = `FL${maxIdNum + 1}`;
      setNewFlight((prev) => ({ ...prev, flight_id: nextId }));
    } catch (error) {
      console.error(error);
      setAlertMessage(error.message);
      setShowAlert(true);
    }
  };

  const fetchCities = async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/dictionaries/cities', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        throw new Error('Ошибка при загрузке городов');
      }
      const cityData = await resp.json();

      const cityNames = cityData.map((c) => (c.name ? c.name : c));
      setAllCities([...new Set(cityNames)]); // unique
    } catch (error) {
      console.error(error);
      setAlertMessage(error.message);
      setShowAlert(true);
    }
  };

  const loadMoreFlights = () => {
    const currentLen = displayedFlights.length;
    const nextChunk = allFlights.slice(currentLen, currentLen + 5);

    setDisplayedFlights((prev) => [...prev, ...nextChunk]);
    if (currentLen + nextChunk.length >= allFlights.length) {
      setHasMoreFlights(false);
    }
  };

  const handleAddFlight = async (e) => {
    e.preventDefault();
    const { flight_id, from, to, date, price, passenger_count } = newFlight;
    if (!flight_id || !from || !to || !price || !date) {
      setAlertMessage('Пожалуйста, заполните все поля рейса');
      setShowAlert(true);
      return;
    }

    try {
      const resp = await fetch('http://127.0.0.1:8000/dictionaries/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flight_id,
          from,
          to,
          price: Number(price),
          date,
          passenger_count: Number(passenger_count),
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.detail || 'Ошибка при добавлении рейса');
      }

      setAlertMessage(`Рейс ${flight_id} успешно добавлен!`);
      setShowAlert(true);

      await fetchFlights();

      setNewFlight((prev) => ({
        ...prev,
        from: '',
        to: '',
        price: 0,
        date: '',
        passenger_count: 0,
      }));
    } catch (error) {
      console.error(error);
      setAlertMessage(error.message);
      setShowAlert(true);
    }
  };

  const handleDeleteFlight = async (flightId) => {
    try {
      const resp = await fetch(
        `http://127.0.0.1:8000/dictionaries/flight?flight_id=${flightId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.detail || 'Ошибка при удалении рейса');
      }

      setAlertMessage(`Рейс "${flightId}" успешно удалён`);
      setShowAlert(true);
      await fetchFlights();
    } catch (error) {
      console.error(error);
      setAlertMessage(error.message);
      setShowAlert(true);
    }
  };

  return (
      <div className="mt-3 card p-3" style={{height: '730px'}}>
        {/* Alert */}
        {showAlert && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {alertMessage}
              <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAlert(false)}
                  aria-label="Close"
              />
            </div>
        )}

        <h5>Управление рейсами</h5>

        <form
            onSubmit={handleAddFlight}
            className="d-flex justify-content-center align-items-start mb-3"
            style={{gap: '24px'}}
        >
          {/* Flight ID (read-only), narrower */}
          <div style={{textAlign: 'center', width: '80px'}}>
            <label style={{display: 'block', marginBottom: '4px'}}>ID рейса</label>
            <TextField
                variant="outlined"
                size="small"
                fullWidth
                value={newFlight.flight_id}
                InputProps={{readOnly: true}}
            />
          </div>

          {/* FROM city (Autocomplete), wider */}
          <div style={{textAlign: 'center', width: '160px'}}>
            <label style={{display: 'block', marginBottom: '4px'}}>Из</label>
            <Autocomplete
                freeSolo
                options={allCities.filter((c) =>
                    c.toLowerCase().includes(newFlight.from.toLowerCase())
                )}
                inputValue={newFlight.from}
                onInputChange={(e, value) =>
                    setNewFlight((prev) => ({...prev, from: value}))
                }
                renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" fullWidth/>
                )}
            />
          </div>

          {/* TO city (Autocomplete), wider */}
          <div style={{textAlign: 'center', width: '160px'}}>
            <label style={{display: 'block', marginBottom: '4px'}}>В</label>
            <Autocomplete
                freeSolo
                options={allCities.filter((c) =>
                    c.toLowerCase().includes(newFlight.to.toLowerCase())
                )}
                inputValue={newFlight.to}
                onInputChange={(e, value) =>
                    setNewFlight((prev) => ({...prev, to: value}))
                }
                renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" fullWidth/>
                )}
            />
          </div>

          {/* DATE remains the same */}
          <div style={{textAlign: 'center'}}>
            <label style={{display: 'block', marginBottom: '4px'}}>Дата</label>
            <TextField
                type="date"
                variant="outlined"
                size="small"
                value={newFlight.date}
                onChange={(e) =>
                    setNewFlight((prev) => ({...prev, date: e.target.value}))
                }
                InputLabelProps={{shrink: true}}
            />
          </div>

          {/* PRICE */}
          <div style={{textAlign: 'center', width: '90px'}}>
            <label style={{display: 'block', marginBottom: '4px'}}>Цена</label>
            <TextField
                type="price"
                variant="outlined"
                size="small"
                fullWidth
                value={newFlight.price}
                onChange={(e) =>
                    setNewFlight((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                }
                inputProps={{min: 0}}
            />
          </div>

          {/* PASSENGER_COUNT, narrower */}
          <div style={{textAlign: 'center', width: '80px'}}>
            <label style={{display: 'block', marginBottom: '4px'}}>Кол-во</label>
            <TextField
                type="number"
                variant="outlined"
                size="small"
                fullWidth
                value={newFlight.passenger_count}
                onChange={(e) =>
                    setNewFlight((prev) => ({
                      ...prev,
                      passenger_count: e.target.value,
                    }))
                }
                inputProps={{min: 0}}
            />
          </div>


          {/* SVG icon button remains the same */}
          <div style={{textAlign: 'center'}}>
            <label style={{visibility: 'hidden', display: 'block', marginBottom: '4px'}}>
              Submit
            </label>
            <button
                type="submit"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                   stroke="#000000" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </form>

        {/* Flights List with Infinite Scroll (in the same container) */}
        <div
            style={{
              height: '585px',
              overflow: 'auto',
              border: '1px solid #ccc',
              borderRadius: '5px',
              padding: '10px',
            }}
        >
          <InfiniteScroll
              pageStart={0}
              loadMore={loadMoreFlights}
              hasMore={hasMoreFlights}
              loader={<div key={0}>Загрузка...</div>}
              useWindow={false}
          >
            {displayedFlights.length === 0 ? (
                <p className="text-muted">Нет рейсов</p>
            ) : (
                displayedFlights.map((flight) => (
                    <div className="card mb-3" key={flight.flight_id}>
                      <div
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '10px',
                            color: 'green',
                            fontSize: '24px',
                            textDecoration: 'underline',
                          }}
                      >
                        {flight.price} ₽
                      </div>
                      <div className="card-body">
                        <h6 className="card-title">Рейс: {flight.flight_id}</h6>
                        <p className="card-text mb-2">
                          <strong>Из:</strong> {flight.from}
                          <br/>
                          <strong>В:</strong> {flight.to}
                          <br/>
                          <strong>Дата:</strong> {flight.date}
                          <br/>
                          <strong>Мест:</strong> {flight.passenger_count}
                        </p>
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteFlight(flight.flight_id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                ))
            )}
          </InfiniteScroll>
        </div>
      </div>
  );
}

export default AdminFlights;
