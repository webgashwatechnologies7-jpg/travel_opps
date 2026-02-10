# Itinerary: Side Panel + New Event + Master Form Alignment

## Aapki requirement (jo samjhi)

1. **Side panel se add**  
   Jab bhi main **side wale dropdown** se kuch select karke (Day Itinerary, Activity, Accommodation, etc.) **+** ya card pe click karke add karta hoon, to **waise hi add ho** jaise **Master** se add kiya hota – yani **same data, same dikhav** (jo master me hai wahi day ke andar event ban jaye).

2. **New Event button**  
   **"+ New Event"** isliye hai taaki koi **Master page pe jaakar add na kare** – yahi itinerary page se hi **New Event** se add kar sake. To dono tarike se add ho sakna chahiye: **side panel** se aur **New Event** se.

3. **Form fields same hona**  
   **Jo fields Master form me hain (Masters → Day Itinerary / Activity / Hotel, etc.), wahi same fields "New Event" ke andar bhi honi chahiye.**  
   - New Event se **Activity** add karu ya Master → Activity se add karu → **dono jagah form me same inputs** (name, destination, details, photo, etc.).  
   - New Event se **Day Itinerary** add karu ya Master → Day Itinerary se → **dono jagah same inputs** (destination, title, details, image).  
   - Isi tarah **Accommodation, Meal, Transportation**, etc. ke liye bhi – **Master jaisa form = New Event wala form**.

---

## Current state (codebase me kya hai)

- **Side panel**  
  - **Day Itinerary** – list master se, click/+ pe event ban jata hai (same data copy). ✓  
  - **Activity** – list master se, click/+ pe event ban jata hai (same data copy). ✓  
  - **Accommodation** – DB/Manual/API se hotel select, phir form open hota hai. ✓  
  - Baaki types (Meal, Transport, etc.) side panel me list/flow abhi alag ho sakta hai.

- **New Event**  
  - Dropdown me: Accommodation, Activity, Transportation, Visa, Meal, Flight, Leisure, Cruise.  
  - **Day Itinerary** option **New Event dropdown me nahi hai** – add karna padega.

- **Form difference**  
  - **Master Activity**: Activity name, Destination, Activity Details, Activity Photo, Status.  
  - **New Event → Activity**: Name, Destination, Type, Date, Start/End time, Show time, Description – **Photo field nahi**, aur layout/labels thode alag.  
  - **Master Day Itinerary**: Destination, Title, Details, Image.  
  - **New Event** me **Day Itinerary** type ka form hi nahi hai (dropdown me option nahi).

---

## Implementation plan (jo karna hai)

1. **New Event dropdown me "Day Itinerary" add karna**  
   Jab user "New Event" → "Day Itinerary" choose kare, to **wahi form** open ho jo **Masters → Day Itinerary** jaisa ho: **Destination, Title, Details, Image** (same fields, same order/labels jahan possible).

2. **Activity form align karna**  
   New Event → Activity form me **Master jaisa fields** hona:  
   - **Activity name** (same label)  
   - **Destination**  
   - **Activity Details** (textarea – same as Description)  
   - **Activity Photo** (image upload – abhi New Event activity me nahi hai, add karna)  
   Optional: Status, Date/Time day-level event ke liye rakh sakte hain, lekin “content” fields Master ke barabar.

3. **Baaki types (Meal, Transport, etc.)**  
   Jahan jahan Master form defined hai (e.g. Transfer, Meal plan, etc.), unke **same fields** New Event ke andar bhi use karna – ek ek karke align kiya ja sakta hai.

---

## Short summary

- **Side se select = Master jaisa add** – already Day Itinerary aur Activity ke liye data copy ho raha hai; display bhi same hona chahiye (already event data me same fields use ho rahe hain).  
- **New Event = bina Master gaye add** – ye flow already hai; bas **Day Itinerary** option add karna aur **sare event types ke forms ko Master jaisa fields** se match karna hai.  
- **Form rule:** Master me jo inputs hain (Day Itinerary, Activity, Accommodation, …) **wahi inputs** New Event ke andar bhi – same labels, same type (text/textarea/image/dropdown), taaki user kahi bhi add kare (side ya New Event), **experience ek jaisa** ho.

Ab implementation me pehle **Day Itinerary** in New Event + **Activity form alignment** (with Photo) kiya ja raha hai.
