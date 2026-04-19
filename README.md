# Hope Harvest - Pantry Finder

This is a webpage that helps people find their local pantries and gives them recipes

## Run

```bash
npm install
npm start
```

To enable the admin page, set an admin token before starting:

```bat
set ADMIN_TOKEN=your-secret-token
npm start
```

Then open:

- `http://localhost:3000`

Admin auth uses the `X-Admin-Token` header.


# Using the Webpage

The landing page shows a list of pantries listed from closest to farthest based on the entered zip code. User can view categories of goods available at a glance and can expand info pages for each location. This page can open google maps with directions, open their website, or call their phone number. They can also open a page that gives recipes with the foods that the selected pantry is offering.


# Admin Page

You need to input admin token to unlock functionality. This page can add or remove pantried from the list, and edit the categories and specific foods that each pantry offers.
