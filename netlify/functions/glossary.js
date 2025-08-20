// netlify/functions/glossary.js

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json'
    };
  
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }
  
    try {
      console.log('=== DEBUGGING INFO ===');
      
      // Webflow API configuration
      const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
      const SITE_ID = process.env.WEBFLOW_SITE_ID;
      const COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID;
  
      console.log('Environment variables check:');
      console.log('WEBFLOW_API_TOKEN exists:', !!WEBFLOW_API_TOKEN);
      console.log('WEBFLOW_SITE_ID exists:', !!SITE_ID);
      console.log('WEBFLOW_COLLECTION_ID exists:', !!COLLECTION_ID);
  
      if (!WEBFLOW_API_TOKEN || !COLLECTION_ID) {
        throw new Error('Missing required environment variables');
      }
  
      // Try the new Webflow API v2 endpoint first
      console.log('Trying Webflow API v2...');
      let apiUrl = `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`;
      console.log('Making API call to:', apiUrl);
      
      let response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
          'Accept': 'application/json'
        }
      });
  
      console.log('Webflow API v2 response status:', response.status);
  
      // If v2 fails, try v1 API
      if (!response.ok) {
        console.log('API v2 failed, trying v1...');
        apiUrl = `https://api.webflow.com/collections/${COLLECTION_ID}/items`;
        
        response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
            'Accept': 'application/json',
            'Accept-Version': '1.0.0'
          }
        });
        
        console.log('Webflow API v1 response status:', response.status);
      }
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webflow API error response:', errorText);
        throw new Error(`Webflow API error: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json();
      console.log('Webflow API success!');
      console.log('Response structure:', Object.keys(data));
      
      // Handle different API response formats
      let items = data.items || data.fieldData || [];
      if (Array.isArray(data)) {
        items = data;
      }
      
      console.log('Items found:', items.length);
      
      if (items.length > 0) {
        console.log('Sample item fields:', Object.keys(items[0]));
        console.log('First item sample:', items[0]);
      }
      
      // Transform the data - try different field name variations
const glossaryItems = items.map(item => {
    const name = item.name || item.title || item['name-field'] || item.fieldData?.name || item.fieldData?.title || 'Untitled';
    const slug = item.slug || item['url-slug'] || item.fieldData?.slug || item.fieldData?.['url-slug'] || '';
    
    return {
      name: name,
      slug: slug,
      url: `https://hr-glossary.culturemonkey.io/blogs/${slug}`,
      description: item.description || item.excerpt || item.fieldData?.description || '',
      _id: item._id || item.id
    };
  });
  
  // ✅ Limit results to 5
  const limitedGlossaryItems = glossaryItems.slice(0, 5);
  
  console.log('Returning', limitedGlossaryItems.length, 'transformed items');
  if (limitedGlossaryItems.length > 0) {
    console.log('Sample transformed item:', limitedGlossaryItems[0]);
  }
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(limitedGlossaryItems) // <-- use limitedGlossaryItems
  };
  
  
    } catch (error) {
      console.error('=== ERROR IN FUNCTION ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to fetch glossary data',
          message: error.message
        })
      };
    }
  };