# Hotel by Location – External API Setup

Aap jahan bhi **location** daalte ho (e.g. Shimla, Kufri, Delhi), wahan pehle **external API** se hotels dhoondhe jaate hain. Agar local data mein hotel na ho, to API se results aate hain.

## Flow (kaise kaam karta hai)

1. **Itinerary / Lead / Hotel** screen pe hotel search karte waqt **location** type karte ho (e.g. "Kufri", "Shimla").
2. Backend pehle **Amadeus** (agar key set ho) try karta hai → phir **RapidAPI Hotels4** (agar key set ho) → phir **local DB** (aapke add kiye hotels) → last mein **sample names** (mock).
3. Jo bhi results aaye, woh list mein dikh jate hain; aap select karke itinerary / lead mein use kar sakte ho.

## Option 1: Amadeus (free, recommended)

- **Site:** https://developers.amadeus.com  
- **Free:** Signup, no credit card  
- **Limit:** Free monthly quota, test environment  

### Steps

1. **Account:** https://developers.amadeus.com/register  
2. **API Keys:** Dashboard → Your API Keys → copy **API Key** (Client ID) aur **API Secret** (Client Secret).  
3. **Backend `.env`** (project root ke `backend` folder ke andar ya jahan Laravel `.env` hai) mein add karo:

```env
AMADEUS_CLIENT_ID=your_api_key_here
AMADEUS_CLIENT_SECRET=your_api_secret_here
```

4. Config cache clear (optional):  
   `php artisan config:clear`  
5. Ab app mein jahan bhi **location** se hotel search hota hai (e.g. Itinerary / Hotel search), wahan pehle Amadeus se hotels aayenge (us city ke liye jo Amadeus support karta hai).

---

## Option 2: RapidAPI – Hotels4

- **Site:** https://rapidapi.com  
- **API:** "Hotels4" ya similar hotel search API (free tier available).  
- **Key:** RapidAPI dashboard se `X-RapidAPI-Key` milta hai.

### Steps

1. **Account:** https://rapidapi.com → signup.  
2. **Hotels4** (ya koi hotel search API) subscribe karo – free plan choose karo.  
3. **Key copy karo** (header mein use hota hai).  
4. **Backend `.env`** mein add karo:

```env
RAPIDAPI_KEY=your_rapidapi_key_here
```

5. Config clear:  
   `php artisan config:clear`  

---

## Priority order (backend)

1. **Amadeus** – agar `AMADEUS_CLIENT_ID` aur `AMADEUS_CLIENT_SECRET` set hain.  
2. **RapidAPI** – agar `RAPIDAPI_KEY` set hai.  
3. **Local DB** – aapke add kiye hue hotels (destination/name match).  
4. **Mock** – koi API/local result na mile to sample hotel names.

---

## Kahan use hota hai

- **Itinerary / Package** – hotel add karte waqt location se search.  
- **Lead / Quotation** – hotel select karte waqt location se search.  
- **Hotel master** – agar koi “search by location” type flow hai to wahan bhi same backend search use hota hai.

Jis bhi screen pe **location** daal kar hotel dhoondhte ho, wahi flow use hota hai; local data na ho to API se hotels milte hain.
