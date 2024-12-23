import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function BookedTickets({ token }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (token) {
      fetchTickets();
    }
    const intervalId = setInterval(() => {
      if (token) fetchTickets();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [token]);

  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      const resp = await fetch("http://127.0.0.1:8000/booking/tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        setTickets(data);
        setLoading(false);
      } else {
        const errorData = await resp.json();
        setError(errorData.detail || "Не удалось загрузить билеты");
        setLoading(false);
      }
    } catch (err) {
      setError("Не удалось загрузить билеты");
      setLoading(false);
    }
  };

  const handlePayment = async (ticket_id) => {
    try {
      const payResp = await fetch(
        `http://127.0.0.1:8000/booking/tickets/${ticket_id}/pay`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!payResp.ok) {
        const payErrorData = await payResp.json();
        setAlert({
          type: "danger",
          message: `Ошибка при оплате билета: ${
            payErrorData.detail || "Unknown error"
          }`,
        });
        return;
      }
      setAlert({
        type: "info",
        message: `Ожидание оплаты билета: ${ticket_id}.`,
      });

      fetchTickets();
    } catch (err) {
      setAlert({ type: "danger", message: "Ошибка при оплате билета" });
    }
  };

  const handleDelete = async (ticket_id) => {
    try {
      const resp = await fetch(`http://127.0.0.1:8000/booking/tickets/${ticket_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (resp.ok) {
        setAlert({ type: 'success', message: `Успешно удалён: ${ticket_id}` });
        fetchTickets();
      } else {
        const errorData = await resp.json();
        setAlert({ type: 'danger', message: `Не произошло удаление: ${errorData.detail || 'Неизвестная ошибка'}` });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Не произошло удаление' });
    }
  };

  const handleRedirectFlights = () => {
    navigate("/flights");
  };

  const handleRedirectOrders = () => {
    navigate("/orders");
  };

  if (loading) {
    return <div>Loading tickets...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mt-5">
      <div
        style={{
          position: "absolute",
          top: "40px",
          right: "60px",
          width: "40px",
          height: "40px",
          cursor: "pointer",
        }}
        onClick={handleRedirectFlights}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="square"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
      <div
          style={{
            position: "absolute",
            top: "41px",
            right: "100px",
            width: "40px",
            height: "40px",
            cursor: "pointer",
          }}
          onClick={handleRedirectOrders}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none"
             stroke="#000000" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="round">
          <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zM3.8 6h16.4M16 10a4 4 0 1 1-8 0"/>
        </svg>
      </div>
      <h2>Забронированные билеты</h2>

      {alert && (
          <div
              className={`alert alert-${alert.type} alert-dismissible fade show`}
              role="alert"
          >
            {alert.message}
            <button
                type="button"
                className="btn-close"
                onClick={() => setAlert(null)}
                aria-label="Close"
          ></button>
        </div>
      )}

      <div className="row">
        {tickets.length === 0 ? (
          <div className="col-12">No tickets booked yet.</div>
        ) : (
          tickets.map((ticket) => (
            <div className="col-md-4" key={ticket.ticket_id}>
              <div
                  className="card mb-3 position-relative"
                  style={{borderRadius: "10px"}}
              >
                <button
                    className="btn btn-link position-absolute w-20 h-20"
                    style={{top: '5px', right: '0px', color: 'red'}}
                    onClick={() => handleDelete(ticket.ticket_id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none"
                       stroke="#000000" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <div className="card-body">
                  <h5 className="card-title">Билет: {ticket.ticket_id}</h5>
                  <p className="card-text">
                    <strong>Рейс:</strong> {ticket.flight_id}
                    <br/>
                    <strong>Цена:</strong> {ticket.price}
                    <br/>
                    <strong>Статус:</strong>{" "}
                    <span
                        style={{
                          color:
                              ticket.status === "pending" ? "orange" : ticket.paid ? "green" : "red",
                        }}
                    >
                      {ticket.status === "pending" ? "обработка..." : ticket.paid ? "оплачено" : "неоплачено"}
                    </span>
                    <br/>
                  </p>
                  {!ticket.paid && (
                      <button
                          className="btn btn-sm"
                          onClick={() => handlePayment(ticket.ticket_id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
                             fill="none"
                             stroke="#000000" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="M7 15h0M2 9.5h20"/>
                        </svg>
                      </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BookedTickets;
