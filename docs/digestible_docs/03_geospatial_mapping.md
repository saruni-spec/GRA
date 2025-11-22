# Part 4: Geospatial Mapping System

## What This Does

Takes businesses from Part 3 and maps them on an interactive map, identifies market clusters, and provides an officer dashboard for field operations.

## The Big Picture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Collect    │───▶│   Cluster    │───▶│   Display    │───▶│   Officer    │
│ GPS Coords   │    │  Businesses  │    │   on Map     │    │  Dashboard   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

## Step-by-Step Process

### Step 1: Collect GPS Coordinates

**Three sources of location data:**

#### Source 1: OSINT Data (from Part 3)
- Google Maps scraping already gave us GPS coordinates
- Import directly from `businesses` table
- Example: Ama's Beauty Salon → (5.6837, -0.1965)

#### Source 2: WhatsApp Location Sharing
**How it works:**
1. Send message to verified business: "Please share your business location using the 📎 attachment button → Location"
2. Business shares location via WhatsApp
3. WhatsApp sends location message with GPS coordinates
4. We extract: latitude, longitude, address (optional)
5. Store in database

**Example WhatsApp location message:**
```json
{
  "type": "location",
  "location": {
    "latitude": 5.6837,
    "longitude": -0.1965,
    "address": "Madina Market, Accra",
    "name": "Ama's Beauty Salon"
  }
}
```

#### Source 3: Manual Entry
- Tax officers can manually mark locations on the map
- Useful for businesses found during field visits

**What we store:**
```json
{
  "business_id": 1,
  "location_type": "whatsapp",  // or "osint" or "manual"
  "latitude": 5.6837,
  "longitude": -0.1965,
  "address": "Madina Market, Accra",
  "accuracy_meters": 10
}
```

### Step 2: Store in PostGIS Database

**Tool:** PostgreSQL with PostGIS extension

**Why PostGIS?**
- Specialized for geographic data
- Can calculate distances between points
- Can find points within a radius
- Can create spatial clusters

**How we store locations:**
```sql
-- Instead of separate lat/lng columns, we use a GEOGRAPHY type
location: GEOGRAPHY(POINT, 4326)

-- Example: POINT(-0.1965 5.6837)
-- Note: PostGIS uses (longitude, latitude) order!
```

**Spatial index:**
- Makes location queries super fast
- Can find "all businesses within 1km" in milliseconds

### Step 3: Cluster Businesses into Markets

**Tool:** Turf.js DBSCAN algorithm

**What is clustering?**
- Groups nearby businesses together
- Identifies market hotspots
- Example: 15 businesses within 500m = "Madina Market cluster"

**How it works:**

1. **Fetch all business locations** from database
2. **Convert to points:** Each business = one point on map
3. **Run DBSCAN algorithm:**
   - Max distance: 500 meters (businesses within 500m are grouped)
   - Min points: 10 (need at least 10 businesses to form a cluster)
4. **Calculate cluster properties:**
   - Center point (average of all locations)
   - Radius (distance from center to furthest business)
   - Business count
   - Density (businesses per km²)

**Example cluster:**
```json
{
  "cluster_id": 1,
  "cluster_name": "Madina Market",
  "center_point": {
    "lat": 5.6837,
    "lng": -0.1965
  },
  "radius_meters": 450,
  "business_count": 23,
  "density_score": 36.2  // businesses per km²
}
```

**Matching to known markets:**
- We have a list of known markets (Makola, Madina, Kaneshie, etc.)
- If cluster center is within 1km of known market → name it
- Otherwise → keep generic name "Cluster 1"

### Step 4: Create Interactive Map

**Tool:** Leaflet.js (JavaScript mapping library)

**Map features:**

#### Base Map
- **Tile provider:** OpenStreetMap (free)
- **Zoom levels:** 10-18
- **Center:** Accra (5.6037, -0.1870)

#### Business Markers
- **Green marker:** Verified business
- **Yellow marker:** Pending verification
- **Red marker:** Unregistered business

**Marker popup shows:**
- Business name
- Phone number
- Business type
- Verification status
- Confidence score
- Market name
- Actions: "Send WhatsApp", "Mark Verified"

#### Cluster Circles
- **Blue circles:** Show market cluster boundaries
- **Radius:** Actual cluster radius from DBSCAN
- **Popup shows:** Cluster name, business count, density

#### Heatmap Layer
- **Toggle on/off:** Show business density
- **Colors:** Blue (low) → Yellow (medium) → Red (high)
- **Useful for:** Identifying new market areas

### Step 5: Add Filters

**Filter options:**
- **Region:** Greater Accra, Ashanti, etc.
- **Status:** Verified, Pending, Unregistered
- **Business Type:** Hairdressing, Food Services, Tailoring, etc.
- **Heatmap:** Show/hide density visualization

**How filters work:**
1. User selects filter (e.g., "Greater Accra" + "Verified")
2. Frontend sends API request: `/api/map/businesses?region=Greater Accra&status=verified`
3. Backend queries database with filters
4. Returns filtered GeoJSON data
5. Map updates to show only matching businesses

### Step 6: Enable Offline Support

**Why offline?**
- Tax officers work in areas with poor internet
- Need to view map even without connection

**How it works:**

#### Cache Map Tiles
1. Download map tiles for specific regions
2. Store in browser's IndexedDB
3. When offline, load tiles from cache instead of internet

**Example:**
- Cache zoom levels 10-13 for Greater Accra region
- Covers ~500 tiles
- ~50MB storage

#### Cache Business Data
1. Use service worker to intercept API requests
2. Store responses in browser cache
3. When offline, serve from cache

**Result:**
- Officer can view map and business data offline
- Can still mark businesses for follow-up
- Syncs changes when back online

## API Endpoints

### Get All Businesses (GeoJSON)
**Endpoint:** `GET /api/map/businesses`

**Query parameters:**
- `region` (optional): Filter by region
- `status` (optional): Filter by verification status
- `businessType` (optional): Filter by category

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-0.1965, 5.6837]
      },
      "properties": {
        "id": 1,
        "name": "Ama's Beauty Salon",
        "phone": "0244123456",
        "category": "hairdressing",
        "status": "verified",
        "confidence": 0.87,
        "market": "Madina Market"
      }
    }
  ]
}
```

### Get Market Clusters
**Endpoint:** `GET /api/map/clusters`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Madina Market",
    "center": [5.6837, -0.1965],
    "radius": 450,
    "count": 23,
    "density": 36.2
  }
]
```

### Get Heatmap Data
**Endpoint:** `GET /api/map/heatmap`

**Response:**
```json
[
  [5.6837, -0.1965, 1],  // [lat, lng, intensity]
  [5.6840, -0.1970, 1],
  ...
]
```

## Useful Spatial Queries

### Find Businesses Within Radius
```sql
-- Find all businesses within 1km of a point
SELECT business_name, 
       ST_Distance(location, ST_GeogFromText('POINT(-0.1965 5.6837)')) as distance_meters
FROM business_locations
WHERE ST_DWithin(location, ST_GeogFromText('POINT(-0.1965 5.6837)'), 1000)
ORDER BY distance_meters;
```

### Find Nearest Market
```sql
-- Find which market a business is closest to
SELECT market_name,
       ST_Distance(bl.location, km.center_point) as distance_meters
FROM business_locations bl
CROSS JOIN known_markets km
WHERE bl.business_id = 123
ORDER BY distance_meters
LIMIT 1;
```

### Count Businesses by Region
```sql
SELECT region,
       COUNT(*) as business_count,
       AVG(ST_Y(location::geometry)) as avg_lat,
       AVG(ST_X(location::geometry)) as avg_lng
FROM businesses b
JOIN business_locations bl ON b.id = bl.business_id
GROUP BY region;
```

## Officer Dashboard Features

**What officers can do:**

1. **View all businesses on map**
   - See markers for each business
   - Color-coded by verification status
   - Click for details

2. **Filter and search**
   - Filter by region, status, type
   - Search by business name or phone

3. **View market clusters**
   - See which markets have most businesses
   - Identify new informal market areas
   - Plan field visit routes

4. **Interact with businesses**
   - Send WhatsApp message directly from map
   - Mark business as verified after field visit
   - Add notes

5. **View statistics**
   - Total businesses mapped
   - Verification rate
   - Businesses per market
   - Coverage by region

6. **Work offline**
   - View cached map and data
   - Mark businesses for follow-up
   - Sync when back online

## Tools Summary

| Component | Tool | What It Does |
|-----------|------|--------------|
| Database | PostgreSQL + PostGIS | Stores geographic data with spatial queries |
| Clustering | Turf.js | Groups nearby businesses into market clusters |
| Map Display | Leaflet.js | Renders interactive map in browser |
| Map Tiles | OpenStreetMap | Provides base map imagery (free) |
| Frontend | React.js | Builds officer dashboard interface |
| Offline Storage | IndexedDB + Service Worker | Caches map tiles and data for offline use |

## Data Flow Summary

```
1. GPS Coordinates Collected
   ├─ From OSINT scraping (Google Maps)
   ├─ From WhatsApp location sharing
   └─ From manual officer entry
   
2. Stored in PostGIS Database
   └─ GEOGRAPHY(POINT) type for efficient spatial queries
   
3. Clustering Algorithm Runs
   ├─ DBSCAN groups nearby businesses
   ├─ Calculates cluster centers and radii
   └─ Matches to known markets
   
4. Map API Serves Data
   ├─ GeoJSON for business markers
   ├─ Cluster data for circles
   └─ Heatmap data for density visualization
   
5. Dashboard Displays
   ├─ Interactive map with markers
   ├─ Filters and search
   ├─ Statistics and insights
   └─ Offline support for field work
```

## Expected Output

**Target:** Map 80%+ of identified businesses

**Success metrics:**
- 20-30 businesses with GPS coordinates
- 2-5 market clusters identified
- Interactive dashboard accessible on mobile
- Offline functionality for field officers
- <2 second load time for map data

**What officers see:**
- Map centered on Accra
- Green/yellow/red markers for businesses
- Blue circles showing market clusters
- Heatmap showing business density
- Filters to narrow down view
- Business details on click
- WhatsApp integration for communication
