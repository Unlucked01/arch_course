import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroller';
import SearchForm from '../components/SearchForm';

function FlightsPage({ token }) {
  const [allFlights, setAllFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [displayedFlights, setDisplayedFlights] = useState([]);
  const [hasMore, setHasMore] = useState(false);

  const [alertMessage, setAlertMessage] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const [_, setSearchParams] = useState({
    cityFrom: '',
    cityTo: '',
    flightDate: '',
    price: 0,
    passengerCount: 1
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchFlights();
    }
  }, [token]);


  const fetchFlights = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/dictionaries/flights", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch flights");
      const data = await response.json();
      setAllFlights(data);
      setFilteredFlights(data); // Initialize filtering
      setDisplayedFlights(data.slice(0, 5)); // First 5 flights
      setHasMore(data.length > 5); // Check if there are more
    } catch (err) {
      console.error(err.message);
      setAlertMessage("Error fetching flights");
      setShowAlert(true);
    }
  };

  const handleSearch = (params) => {
    setSearchParams(params);
    const { cityFrom, cityTo, flightDate } = params;

    const filtered = allFlights.filter((flight) => {
      const matchCityFrom = cityFrom
        ? flight.from.toLowerCase().includes(cityFrom.toLowerCase())
        : true;
      const matchCityTo = cityTo
        ? flight.to.toLowerCase().includes(cityTo.toLowerCase())
        : true;
      const matchDate = flightDate ? flight.date === flightDate : true;

      return matchCityFrom && matchCityTo && matchDate;
    });

    setFilteredFlights(filtered);
    setDisplayedFlights(filtered.slice(0, 5)); // Reset to first 5
    setHasMore(filtered.length > 5);
  };

  const loadMoreFlights = () => {
    const currentLength = displayedFlights.length;
    const nextChunk = filteredFlights.slice(currentLength, currentLength + 5);

    setDisplayedFlights([...displayedFlights, ...nextChunk]);
    if (currentLength + nextChunk.length >= filteredFlights.length) {
      setHasMore(false);
    }
  };

  const handleBook = async (flight_id, price) => {
    if (!token) {
      setAlertMessage("Сначала необходимо войти в аккаунт.");
      setShowAlert(true);
      return;
    }

    const resp = await fetch(`http://127.0.0.1:8000/booking/tickets?flight_id=${flight_id}&price=${price}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

    if (resp.ok) {
      const data = await resp.json();
      setAlertMessage(`Билет ${data.ticket_id} забронирован успешно!`);

      const updatedFlights = filteredFlights.map((flight) =>
        flight.flight_id === flight_id
          ? { ...flight, passenger_count: flight.passenger_count - 1 }
          : flight
      );
      setFilteredFlights(updatedFlights);
      setDisplayedFlights(updatedFlights.slice(0, displayedFlights.length));
    } else {
      const errorData = await resp.json();
      setAlertMessage(`Неудачное бронирование билета: ${errorData.detail || 'Unknown error'}`);
    }
    setShowAlert(true);
  };

  const handleRedirectTickets = () => {
    navigate('/tickets');
  };

  const handleRedirectOrders = () => {
    navigate('/orders');
  };

  return (
      <div className="container mt-5 position-relative">
      {/* Alert Popup */}
        {showAlert && (
          <div className="alert alert-success alert-dismissible fade show" style={{width: "90%"}} role="alert">
            {alertMessage}
            <button type="button" className="btn-close" onClick={() => setShowAlert(false)} aria-label="Close"></button>
          </div>
        )}
        {/* Buttons to redirect */}
        <div
            style={{
              position: 'absolute',
              top: '0px',
              right: '60px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
            }}
            onClick={handleRedirectTickets}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
               stroke="#000000" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="round">
            <circle cx="10" cy="20.5" r="1"/>
            <circle cx="18" cy="20.5" r="1"/>
            <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"/>
          </svg>
        </div>

          <div
              style={{
                  position: 'absolute',
                  top: '0px',
                  right: '10px',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
              }}
              onClick={handleRedirectOrders}
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                   stroke="#000000" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="round">
                  <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zM3.8 6h16.4M16 10a4 4 0 1 1-8 0"/>
              </svg>
          </div>

          <h2>Поиск и бронирование авиабилетов</h2>

          <SearchForm onSearch={handleSearch}/>

          <div className="mt-3" style={{
              height: '570px',
              overflow: 'auto',
              border: '1px solid #ccc',
              borderRadius: '5px',
          padding: '10px'
        }}>
          <InfiniteScroll
              pageStart={0}
              loadMore={loadMoreFlights}
              hasMore={hasMore}
              loader={<div className="loader" key={0}>Loading ...</div>}
              useWindow={false}
          >
            {filteredFlights.map(flight => (
                <div className="card mb-3" style={{borderRadius: '10px'}} key={flight.flight_id}>
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
                    <h5 className="card-title">Полет: {flight.flight_id}</h5>
                    <p className="card-text">
                      <strong>Из:</strong> {flight.from}<br/>
                      <strong>В:</strong> {flight.to}<br/>
                      <strong>Дата:</strong> {flight.date}<br/>
                      <strong>Количество мест:</strong> {flight.passenger_count}<br/>
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={() => handleBook(flight.flight_id, flight.price)}>
                      Забронировать
                    </button>
                  </div>
                </div>
            ))}
          </InfiniteScroll>
        </div>
      </div>
  );
}

export default FlightsPage;
