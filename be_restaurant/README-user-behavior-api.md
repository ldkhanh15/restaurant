# User Behavior Tracking and Recommendation API

This document describes the new API endpoints for user behavior tracking and dish recommendations.

## 1. Log User Behavior

Logs user interactions with dishes in the system.

```
POST /api/user-behavior
```

### Request Body

```json
{
  "user_id": "user-uuid",
  "item_id": "dish-uuid",
  "action_type": "ORDER", // or "CLICK", "VIEW", "CANCEL", "SEARCH"
  "search_query": "pizza cay" // only required for SEARCH actions
}
```

### Action Types and Scoring

- `ORDER`: +10 points
- `CLICK`: +3 points
- `VIEW`: +1 point
- `CANCEL`: -5 points
- `SEARCH`: Tracks search terms for relevance scoring

### Response

```json
{
  "success": true,
  "data": {
    "id": "generated-uuid",
    "user_id": "user-uuid",
    "item_id": "dish-uuid",
    "action_type": "ORDER",
    "search_query": null,
    "timestamp": "2025-10-04T10:15:30.000Z"
  }
}
```

## 2. Get Recommended Dishes

Returns dishes sorted by relevance to the user based on their behavior and search history.

```
GET /api/dishes/recommended?user_id=user-uuid&page=1&limit=10
```

### Query Parameters

- `user_id`: User UUID (required)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Recommendation Algorithm

1. **Behavior Scoring**
   - ORDER: +10 points
   - CLICK: +3 points
   - VIEW: +1 point
   - CANCEL: -5 points

2. **Search Relevance**
   - Uses last 50 search queries
   - Extracts keywords and calculates frequency
   - Performs FULLTEXT search against dish names and descriptions
   - Adds `relevance_score * 2` to the total priority score

3. **Result Sorting**
   - Sorts dishes by combined behavior and relevance scores

### Response

```json
{
  "success": true,
  "count": 42,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "data": [
    {
      "id": "dish-uuid-1",
      "name": "Phở Bò Tái",
      "description": "Phở nạm bò tái",
      "price": 55000,
      "category_id": "category-uuid",
      "behavior_score": 15,
      "relevance_score": 4.2,
      "priority_score": 19.2
    },
    // ... more dishes sorted by priority_score
  ]
}
```

## Implementation Notes

1. **Database Preparation**
   - Execute the SQL in `src/migrations/add-fulltext-index.sql` to create a FULLTEXT index on the dishes table.
   
2. **Authentication**
   - Both endpoints require authentication.

3. **Error Cases**
   - Invalid action_type will return a 400 error
   - Missing required fields will return a 400 error