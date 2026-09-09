# GREENMAP User Manual

**Digital Tree Mapping & Green Cover Documentation System**  
**Community Engagement Project (CEP)**  
**Theem College of Arts, Commerce & Science**

## 1. Important Data Notice

The current website is a working prototype. It displays clearly labelled DEMO / SAMPLE records so that the screens can be demonstrated immediately.

Do not present the sample records, coordinates, photographs, statistics, or observations as actual field findings. Replace them with verified survey data before a project presentation.

Current prototype status:

- Tree, green-space, and gallery records are stored locally in `src/App.jsx`.
- The map uses sample coordinates.
- The survey form shows a local success message only; it does not save to a server.
- The Supabase database schema is prepared in `supabase/schema.sql`, but the React app is not connected to Supabase yet.
- There is currently no login-protected admin dashboard.

## 2. Start the Website

Open PowerShell in the project folder:

```powershell
cd C:\Users\asus\OneDrive\Desktop\cep
npm install
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173/
```

To create a production build:

```powershell
npm run build
```

## 3. Main Navigation

- **Home**: Project introduction and workflow.
- **Tree Map**: Interactive Leaflet/OpenStreetMap view with sample tree markers.
- **Tree Catalogue**: Search and filter tree records.
- **Green Spaces**: Browse lawns, gardens, and vegetation zones.
- **Statistics**: View summaries calculated from the current records.
- **Survey**: Collect a community-awareness response in the prototype form.
- **Gallery**: View placeholder/demo field images.
- **About**: Project purpose, objectives, methodology, and future scope.

The website is responsive. On mobile, press the menu icon in the top-right corner.

## 4. How to Use the Tree Map

1. Open **Tree Map**.
2. Wait for the OpenStreetMap tiles to load.
3. Select a tree marker to preview its name, zone, condition, and demo status.
4. Select **View full record** to open the detailed tree page.
5. Use the map zoom controls at the lower-right.
6. The green circle represents a sample green-space area.
7. Read the map notice carefully: coordinates must be replaced with verified GPS coordinates.

The map markers are generated from the `trees` array in `src/App.jsx`. They are not manually added to the map one by one.

## 5. How to Search the Catalogue

1. Open **Tree Catalogue**.
2. Type a Tree ID, common name, scientific name, or zone into the search field.
3. Use the condition dropdown to filter by:
   - Healthy
   - Fair
   - Needs Attention
   - Damaged
4. Select **Clear filters** to return to all records.
5. Click any tree card to open its detailed profile.

The displayed tree count is calculated from the filtered records.

## 6. How to Add Actual Tree Data: Current Prototype Method

Until Supabase is connected, edit the `trees` array near the top of `src/App.jsx`.

Use this format:

```js
{
  id: "TREE-006",
  common: "Actual common name",
  scientific: "Scientific name",
  family: "Plant family",
  zone: "Verified area or zone",
  condition: "Healthy",
  date: "2026-09-01",
  lat: 19.2821,
  lng: 73.0492,
  remark: "Verified field observation.",
  image: "https://your-approved-image-url.example/tree.jpg"
}
```

Rules for actual records:

- Give every tree a unique ID such as `TREE-006`.
- Use the real survey date in `YYYY-MM-DD` format.
- Add verified latitude and longitude from GPS or a trusted mapping source.
- Use only approved field photographs or images for which the project has permission.
- Use one of the supported condition values exactly: `Healthy`, `Fair`, `Needs Attention`, `Damaged`, or `Dead`.
- Replace the word `sample` or `demo` in remarks when the record has been verified.
- Keep personal information out of remarks.

After editing, save the file and refresh the browser. The catalogue, map, detail pages, and statistics will use the updated local records.

## 7. How to Add Green Spaces: Current Prototype Method

Edit the `spaces` array in `src/App.jsx`.

Example:

```js
{
  name: "Verified Community Garden",
  type: "Community garden",
  location: "South Courtyard",
  area: "250 m²",
  condition: "Good",
  description: "Description based on field observation."
}
```

Green-space records currently appear on the **Green Spaces** page and contribute to the statistics count. Their detailed GPS geometry is not yet connected to the map UI.

## 8. How to Add Gallery Images: Current Prototype Method

Edit the `images` array inside the `Gallery` component in `src/App.jsx`.

Each item contains:

```js
[
  "Image title",
  "Category",
  "Verified location",
  "Approved image URL"
]
```

Use categories such as `Trees`, `Green Spaces`, `Survey Activities`, or `Community Awareness`. Replace the `DEMO IMAGE` wording when the image is an actual approved field photograph.

## 9. How to Use the Survey Page

1. Open **Survey**.
2. Enter optional participant details only with consent.
3. Select age group and zone when the participant is comfortable providing them.
4. Answer the awareness question.
5. Select a green-space importance rating from 1 to 5.
6. Add a suggestion if desired.
7. Submit the response.

In the current version, submission only changes the screen locally. It does not create a database record. The page intentionally says that no real survey responses have been recorded.

Do not create fake responses just to populate charts. Test responses must be labelled as demo responses and kept separate from actual survey findings.

## 10. Supabase Setup for Real Data

When the team is ready to use a database:

1. Create a Supabase project.
2. Open the Supabase **SQL Editor**.
3. Run the complete file `supabase/schema.sql`.
4. Add the required Row Level Security policies.
5. Add Supabase client configuration to the React app using environment variables.
6. Replace the local arrays with database queries.
7. Connect the survey form to `survey_responses`.
8. Connect image uploads to Supabase Storage and save the public URL in the relevant table.
9. Add Supabase Auth before exposing add, edit, or delete operations.

The schema contains these tables:

- `trees`
- `green_spaces`
- `survey_responses`
- `gallery`

The `is_demo` column on trees, green spaces, and gallery records should be used to keep sample data separate from verified records.

Example tree insert after the schema is installed:

```sql
insert into public.trees (
  tree_id,
  common_name,
  scientific_name,
  family,
  location_zone,
  latitude,
  longitude,
  condition,
  date_surveyed,
  remarks,
  is_demo
) values (
  'TREE-006',
  'Neem',
  'Azadirachta indica',
  'Meliaceae',
  'North Boundary',
  19.2821,
  73.0492,
  'Healthy',
  '2026-09-01',
  'Verified during the CEP field survey.',
  false
);
```

Do not run this insert with invented values. Replace every value with verified field information.

## 11. Recommended Field Data Workflow

1. Assign a unique Tree ID before recording.
2. Photograph the tree only after receiving permission where required.
3. Identify the common and scientific name using a reliable reference.
4. Record GPS coordinates and check that they are within the survey area.
5. Record condition using the agreed project definitions.
6. Write a short factual observation without unsupported environmental claims.
7. Review the entry with another team member.
8. Enter the verified record into Supabase or the temporary local array.
9. Check the tree on the map and catalogue.
10. Keep original field notes as project evidence.

## 12. Condition Definitions

- **Healthy**: No significant visible damage or stress observed.
- **Fair**: Some minor damage or stress observed, but the tree is generally stable.
- **Needs Attention**: A follow-up check or care action is recommended.
- **Damaged**: Noticeable damage is present and should be documented for review.
- **Dead**: No visible signs of living foliage or active growth at the time of observation.

These are documentation labels, not professional arborist diagnoses.

## 13. Before Project Presentation

- Replace or remove all demo tree records.
- Replace demo map coordinates with verified coordinates.
- Replace placeholder gallery images with approved field photographs.
- Confirm statistics are based only on actual records.
- Do not claim biodiversity, environmental impact, or green-cover improvement without supporting measurements.
- Make sure survey findings are based on real responses and include the response count.
- Keep the demo notice visible if sample records remain.
- Test the website on a laptop and mobile phone.
- Run `npm run build` and `npm run lint`.

## 14. Current Limitations and Next Development Tasks

The next engineering tasks for a full production version are:

- Connect Supabase reads for trees and green spaces.
- Add Supabase Auth and a protected admin route.
- Build add/edit/delete forms for authorized users.
- Connect survey submission to `survey_responses`.
- Add real database-powered charts.
- Add Supabase Storage for image uploads.
- Add proper green-space polygons and map toggles.
- Add database error, loading, and empty states around API requests.

Until these are implemented, treat this website as a polished, data-transparent academic prototype.
