# GreenMap User Manual

## Public visitor

1. Open the GreenMap home page.
2. Use **Explore map** to view published individual tree records with verified GPS coordinates.
3. Use **Tree catalogue** to search by tree ID, name or scientific name, and filter by zone or condition.
4. Open a tree card for record details. Missing scientific names or coordinates are explicitly shown as not verified/not recorded.
5. Use **Insights** to distinguish survey aggregate counts from individual database records.
6. Browse Green Spaces and Gallery for published records.
7. Submit the environmental survey without creating an account.

### Understanding the numbers

The survey summary records 38 trees in total: Main Ground 10, Volleyball Ground 21, Parking 7, Flower Garden 0. Condition counts are Healthy 25, Needs Attention 10 and Uncertain 3. These aggregate numbers do not represent 38 database documents or 38 map markers.

## Administrator setup

1. Configure a real MongoDB Atlas URI and a unique session secret in `server/.env`.
2. Run `npm run admin:create` once to provision the admin.
3. Run `npm run data:import-summary` to import the documented summary and campus zones.
4. Start GreenMap with `npm run dev`.
5. Open Admin login and sign in with the provisioned credentials.

Public registration is intentionally unavailable. If an administrator account already exists, use `npm run admin:reset` after updating the matching username/password values in the local environment file.

## Add and verify a tree

1. Sign in as admin and choose Tree records.
2. Enter the tree ID from the actual survey/approved record and the recorded common name.
3. Select a known zone. Scientific names may be left blank unless independently verified.
4. Add GPS coordinates only if they are known. Use the interactive map to choose the location. Check the box confirming you have verified the exact coordinates against the field location.
5. Optional: upload a genuine field photograph (JPG, PNG or WEBP, up to 5 MB).
6. Save the record. New records start pending.
7. Review the record and select Verify to publish it.
8. Only a verified record with coordinates explicitly marked verified appears as a map marker.

Do not infer coordinates from a zone center or create a tree document just to make the count equal 38.

## Green spaces, zones and gallery

- Green Spaces: create a named documented space; optionally assign a zone and photo.
- Campus Zones: add a new zone with a name, description and display order. A zone linked to tree records/green spaces cannot be deleted until those records are reassigned.
- Gallery: upload genuine campus/field photographs, provide title, category, alt text and an optional description. Deleting a gallery entry also attempts to remove its Cloudinary asset.

## Survey response review

Survey submissions are stored privately in MongoDB and shown to admins. Review the response and remove only when appropriate. Survey content is never exposed by a public list endpoint.

## Common configuration errors

- **`querySrv EBADNAME _mongodb._tcp.<cluster-host>`:** `MONGO_URL` still contains the placeholder. Copy the full URI from Atlas → Connect → Drivers and replace all example values.
- **`Cannot find module dotenv` or `vite is not recognized`:** run `npm install` from the repository root and wait for it to finish successfully. Do not run `install:all` directly; use npm scripts.
- **Login says credentials are incorrect:** ensure the Atlas connection works, run the one-time admin creation script or password reset script as appropriate, use the exact username, and check that the account is active.
- **Image upload says Cloudinary is not configured:** add Cloudinary credentials to `server/.env` and restart the API.
- **CSRF token expired:** refresh the page and retry. Keep frontend and API origin/CORS settings consistent.
- **Duplicate tree ID:** use the actual unique survey ID and do not duplicate a record.
