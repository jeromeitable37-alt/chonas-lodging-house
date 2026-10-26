# Chona’s Lodging House Reservation System

Photo-based room browsing and reservation-request website recovered from an earlier saved UI snapshot.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Build for production with `npm run build`.

## Included

- Room cards with photographic imagery
- Room search and filters
- Reservation request and booking views
- Demo admin and room-management screens
- Responsive desktop and mobile styling

## Important limitation

This recovered UI snapshot stores rooms and reservations in the current browser using `localStorage`. It is a demo/prototype only: data is not shared between devices, and it does not restore the original `server/index.js` API or persistent backend from the ZIP uploaded in a previous chat. For production use, restore that original backend or connect a properly secured shared database and staff authentication.

Room photographs load from external image URLs, so they require an internet connection.
