<?php

namespace App\Services;

/**
 * Default sections structure for travel-package template.
 * User can edit all fields without writing code.
 */
class LandingPageTemplateService
{
    public static function getDefaultSections(string $template = 'travel-package'): array
    {
        if ($template === 'travel-package') {
            return [
                'header' => [
                    'logo' => '',
                    'slogan' => 'We Plan, You Pack',
                    'phone' => '+91 9816945091',
                    'email' => 'info@example.com',
                ],
                'hero' => [
                    'title' => 'Tour Package',
                    'subtitle' => 'Destination 1 | Destination 2 | Destination 3',
                    'tagline' => 'Lowest Price Guaranteed',
                    'backgroundImage' => '',
                    'formTitle' => 'Fill Form & Get Free Quotes',
                ],
                'about' => [
                    'title' => 'About',
                    'content' => 'Enter your destination description here. You can edit this content anytime.',
                    'ctaText' => 'CALL NOW FOR CUSTOMIZED PACKAGES',
                    'ctaPhone' => '+91 9816945091',
                ],
                'whyUs' => [
                    'title' => 'Why Us',
                    'items' => [
                        ['icon' => 'badge', 'title' => 'Approved', 'description' => 'Approved by Ministry of Tourism'],
                        ['icon' => 'map', 'title' => 'Trusted', 'description' => 'Trusted name in Tour Packages'],
                        ['icon' => 'award', 'title' => 'Best Service', 'description' => 'Best B to B Service Provider'],
                        ['icon' => 'money', 'title' => 'Value', 'description' => 'Value for Money Packages'],
                        ['icon' => 'puzzle', 'title' => 'Customized', 'description' => 'Customized Solutions'],
                        ['icon' => 'user', 'title' => 'Personalized', 'description' => 'Personalized Services'],
                    ],
                ],
                'packages' => [
                    'title' => 'Our Best Selling Tour Packages',
                    'items' => [
                        [
                            'image' => '',
                            'discount' => '25',
                            'title' => 'Package 1',
                            'duration' => '05 Nights / 06 Days',
                            'inclusions' => ['Welcome drink on arrival', 'Parking and toll tax'],
                            'price' => '7999',
                            'link' => '#',
                        ],
                        [
                            'image' => '',
                            'discount' => '30',
                            'title' => 'Package 2',
                            'duration' => '09 Nights / 10 Days',
                            'inclusions' => ['Welcome drink', 'Sightseeing'],
                            'price' => '12999',
                            'link' => '#',
                        ],
                    ],
                ],
                'whyBookOnline' => [
                    'title' => 'Why Book Online with us',
                    'items' => [
                        ['icon' => 'clock', 'title' => 'SAVE TIME', 'description' => 'No need to surf Multiple Sites'],
                        ['icon' => 'options', 'title' => 'MULTIPLE OPTIONS', 'description' => 'Personalised Suggestions'],
                        ['icon' => 'money', 'title' => 'SAVE MONEY', 'description' => 'Compare, Negotiate & Choose'],
                        ['icon' => 'shield', 'title' => 'TRUSTED NETWORK', 'description' => '2000+ Hotels Reliable & Authentic'],
                    ],
                ],
                'footer' => [
                    'phone' => '+91 9816945091',
                    'email' => 'info@example.com',
                    'links' => ['ABOUT US', 'CONTACT US', 'BOOK NOW'],
                    'copyright' => '© COPYRIGHT. All Rights Reserved',
                ],
            ];
        }

        return [
            'hero' => [
                'title' => 'Landing Page',
                'subtitle' => 'Fill in your content',
                'formTitle' => 'Get Free Quote',
            ],
            'about' => [
                'title' => 'About',
                'content' => 'Your content here',
                'ctaText' => 'Contact Us',
            ],
            'packages' => [
                'title' => 'Packages',
                'items' => [],
            ],
        ];
    }
}
