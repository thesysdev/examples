# Data Visualization Examples

This application demonstrates querying data from Supabase, generating AI-powered visualizations with Thesys, and displaying both the visualization and raw data in the frontend.

## Sample Queries to Try

### Sales Analysis

- "Show me the top 5 best-selling products by revenue"
- "What are the total sales by product category?"
- "Show me sales trends over time"

### Product Analysis

- "List all products with their current stock levels"
- "What's the average price by product category?"
- "Show me products that are low in stock"

### Customer Analysis

- "How many customers do we have by country?"
- "Show me customer distribution by city"
- "List recent customer registrations"

### Combined Analysis

- "Show me sales performance with customer and product details"
- "Which customers have made the most purchases?"
- "What products are popular in different countries?"

## How It Works

1. **User Query**: Enter a natural language query about the business data
2. **AI Processing**: OpenAI processes the query and uses Supabase MCP tools to fetch data
3. **Data Analysis**: The AI analyzes the data and provides insights
4. **Visualization**: Thesys Visualize generates charts, graphs, and interactive components
5. **Dual Display**:
   - **C1 Component**: Shows the AI-generated visualization and insights
   - **Data Table**: Displays the raw query results in a structured table

## Database Schema

### Products Table

- `id`: Product ID
- `name`: Product name
- `category`: Product category (Electronics, Furniture, Appliances)
- `price`: Product price
- `stock_quantity`: Current inventory
- `created_at`: Creation timestamp

### Customers Table

- `id`: Customer ID
- `name`: Customer name
- `email`: Customer email
- `city`: Customer city
- `country`: Customer country
- `created_at`: Registration timestamp

### Sales Table

- `id`: Sale ID
- `product_id`: Reference to product
- `customer_id`: Reference to customer
- `quantity`: Items sold
- `unit_price`: Price per unit
- `total_amount`: Total sale amount
- `sale_date`: Sale timestamp

## Features

- **Real-time Data**: Queries live data from Supabase
- **AI-Powered Insights**: OpenAI analyzes data and provides meaningful insights
- **Rich Visualizations**: Thesys generates appropriate charts and graphs
- **Raw Data Access**: View the underlying data in formatted tables
- **Natural Language**: Ask questions in plain English
- **Responsive Design**: Works on desktop and mobile devices
