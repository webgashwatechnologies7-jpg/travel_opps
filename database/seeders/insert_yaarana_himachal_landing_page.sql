-- INSERT: Yaarana Holiday - Himachal Tour Package Landing Page
-- Run: Replace @company_id and @created_by with your actual IDs
-- company_id: Use NULL if no company, OR valid ID from companies table (check: SELECT id FROM companies)
-- created_by: Use NULL or valid user ID from users table

SET @company_id = NULL;   -- NULL = no company (avoids FK error). Set to 1,2,3 etc if company exists
SET @created_by = NULL;   -- NULL = no creator. Set to user id if needed
INSERT INTO `landing_pages` (
  `company_id`,
  `name`,
  `title`,
  `url_slug`,
  `template`,
  `meta_description`,
  `content`,
  `sections`,
  `status`,
  `views`,
  `conversions`,
  `conversion_rate`,
  `published_at`,
  `created_by`,
  `created_at`,
  `updated_at`
) VALUES (
  @company_id,
  'Himachal Tour Package',
  'Himachal Tour Package',
  'himachal-tour-package',
  'travel-package',
  'Himachal Pradesh tour packages - Shimla, Manali, Kullu, Khajjiar, Dharamshala. Lowest price guaranteed. Approved by Ministry of Tourism.',
  NULL,
  '{
    "header": {
      "logo": "",
      "slogan": "We Plan, You Pack",
      "phone": "+91 9816945091",
      "email": "info@yaaranaholiday.com"
    },
    "hero": {
      "title": "Himachal Tour Package",
      "subtitle": "SHIMLA | MANALI | KULLU | KHAJJIAR | DHARAMSHALA | DALHOUSIE",
      "tagline": "Lowest Price Guaranteed",
      "backgroundImage": "",
      "formTitle": "Fill Form & Get Free Quotes"
    },
    "about": {
      "title": "About Himachal",
      "content": "Himachal Pradesh is a state in the northern piece of India. Arranged in the Western Himalayas, it is one of the eleven mountain states and is described by an outrageous scene highlighting a few pinnacles and broad waterway frameworks. The state is additionally alluded to as Dev Bhoomi. The Himalayas draws in travelers from everywhere the world. Slope stations like Shimla, Manali, Dharamshala, Dalhousie, Chamba, Khajjiar, Kullu and Kasauli are well known objections for both homegrown and unfamiliar vacationers.",
      "ctaText": "CALL NOW FOR CUSTOMIZED PACKAGES",
      "ctaPhone": "+91 9816945091"
    },
    "whyUs": {
      "title": "Why Us",
      "items": [
        {"icon": "badge", "title": "Approved by Ministry of Tourism, Government of India", "description": ""},
        {"icon": "map", "title": "Trusted name in Himachal Tour Packages", "description": ""},
        {"icon": "award", "title": "Best B to B Service Provider", "description": ""},
        {"icon": "money", "title": "Value for Money Packages", "description": ""},
        {"icon": "puzzle", "title": "Customized Solutions", "description": ""},
        {"icon": "user", "title": "Personalized Services", "description": ""}
      ]
    },
    "packages": {
      "title": "Our Best Selling Tour Packages",
      "items": [
        {"image": "", "discount": "25", "title": "Best of Shimla & Manali", "duration": "05 Nights / 06 Days", "inclusions": ["Welcome drink on arrival", "Parking and toll tax"], "price": "7,999", "link": "#"},
        {"image": "", "discount": "30", "title": "Browse Himachal", "duration": "09 Nights / 10 Days", "inclusions": ["Welcome drink on arrival", "Parking and toll tax"], "price": "14,999", "link": "#"},
        {"image": "", "discount": "25", "title": "Mesmerizing Himachal with Delhi", "duration": "06 Nights / 07 Days", "inclusions": ["Welcome drink on arrival", "Parking and toll tax"], "price": "9,899", "link": "#"},
        {"image": "", "discount": "30", "title": "Mystic Manali by Volvo", "duration": "03 Nights / 04 Days", "inclusions": ["Welcome drink on arrival", "Parking and toll tax"], "price": "5,299", "link": "#"},
        {"image": "", "discount": "25", "title": "Taj Mahal with the Himalayas", "duration": "08 Nights / 09 Days", "inclusions": ["Welcome drink on arrival", "Parking and toll tax"], "price": "13,799", "link": "#"},
        {"image": "", "discount": "30", "title": "Himachal Tour With Amritsar", "duration": "06 Nights / 07 Days", "inclusions": ["Welcome drink on arrival", "Parking and toll tax"], "price": "10,999", "link": "#"},
        {"image": "", "discount": "30", "title": "Dharmshala Dalhousie By Cab", "duration": "04 Nights / 05 Days", "inclusions": ["Welcome drink on arrival", "Parking and Toll tax"], "price": "6,999", "link": "#"},
        {"image": "", "discount": "25", "title": "Manali With Tirthan Valley (Jibhi)", "duration": "05 Nights / 06 Days", "inclusions": ["Welcome drink on arrival", "Parking and Toll tax"], "price": "8,299", "link": "#"},
        {"image": "", "discount": "30", "title": "Tosh Kheer Ganga Trek On The Way Kasol", "duration": "04 Nights / 05 Days", "inclusions": ["Welcome drink on arrival", "Parking and Toll tax"], "price": "7,299", "link": "#"}
      ]
    },
    "whyBookOnline": {
      "title": "Why Book Online with us",
      "items": [
        {"icon": "clock", "title": "SAVE TIME", "description": "No need to surf Multiple Sites for packages, quotes, travel plans"},
        {"icon": "options", "title": "MULTIPLE OPTIONS", "description": "Get Multiple Itineraries & Personalised Suggestions from our Travel agents"},
        {"icon": "money", "title": "SAVE MONEY", "description": "Compare, Negotiate & Choose the best from multiple options"},
        {"icon": "shield", "title": "TRUSTED NETWORK", "description": "of 2000+ Hotels Reliable & Authentic Travel Guides in Himalaya"}
      ]
    },
    "footer": {
      "phone": "+91 9816945091",
      "email": "info@yaaranaholiday.com",
      "links": ["ABOUT US", "SHIMLA", "MANALI", "KULLU", "KHAJJIAR", "DHARAMSHALA", "BOOK NOW", "CONTACT US"],
      "copyright": "© COPYRIGHT 2021, YAARANA HOLIDAY ALL RIGHTS RESERVED MANAGED BY GT GARHWA"
    }
  }',
  'published',
  0,
  0,
  0,
  NOW(),
  @created_by,
  NOW(),
  NOW()
);
