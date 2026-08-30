/**
 * ProductRepository Interface
 * 
 * Defines the contract for all product data access operations.
 * This establishes the boundary between application/UI logic and Firestore/infrastructure.
 */
export class ProductRepository {
    /**
     * Get a single product by ID
     * @param {string} id 
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        throw new Error('Method not implemented.');
    }

    /**
     * Get multiple products by their IDs
     * @param {Array<string>} ids 
     * @returns {Promise<Array<Object>>}
     */
    async getByIds(ids) {
        throw new Error('Method not implemented.');
    }

    /**
     * Get paginated products with dual-query and in-memory filtering fallback.
     * @param {Object} filters 
     * @param {number} limit 
     * @param {Object|null} cursor 
     * @returns {Promise<{products: Array, hasMore: boolean, total: number, nextCursor: Object|null}>}
     */
    async getPaginated(filters, limit, cursor = null) {
        throw new Error('Method not implemented.');
    }

    /**
     * Get the latest products
     * @param {number} limitCount 
     * @returns {Promise<Array>}
     */
    async getLatest(limitCount = 6) {
        throw new Error('Method not implemented.');
    }

    /**
     * Get the best selling products
     * @param {number} limitCount 
     * @returns {Promise<Array>}
     */
    async getBestSellers(limitCount = 6) {
        throw new Error('Method not implemented.');
    }

    /**
     * Subscribe to a list of products (used by Dashboard and Hero Carousel)
     * @param {Object} filters 
     * @param {Function} callback 
     * @returns {Function} unsubscribe function
     */
    subscribeToList(filters, callback) {
        throw new Error('Method not implemented.');
    }

    /**
     * Get available brand IDs for a specific category
     * @param {string} categoryId
     * @returns {Promise<Array<string>>}
     */
    async getAvailableBrandIds(categoryId) {
        throw new Error('Method not implemented.');
    }

    /**
     * Get related products
     * @param {string} id 
     * @param {number} limitCount 
     * @returns {Promise<Array>}
     */
    async getRelated(id, limitCount = 12) {
        throw new Error('Method not implemented.');
    }

    /**
     * Subscribe to a single product's details
     * @param {string} id 
     * @param {Function} callback 
     * @returns {Function} unsubscribe function
     */
    subscribeToDetail(id, callback) {
        throw new Error('Method not implemented.');
    }

    /**
     * Get product statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        throw new Error('Method not implemented.');
    }

    /**
     * Create a new product
     * @param {Object} productData 
     * @returns {Promise<string>} The newly created product ID
     */
    async create(productData) {
        throw new Error('Method not implemented.');
    }

    /**
     * Create a new product with a specific client-generated ID
     * @param {string} id 
     * @param {Object} productData 
     * @returns {Promise<string>}
     */
    async createWithId(id, productData) {
        throw new Error('Method not implemented.');
    }

    /**
     * Update an existing product
     * @param {string} id 
     * @param {Object} productData 
     * @returns {Promise<void>}
     */
    async update(id, productData) {
        throw new Error('Method not implemented.');
    }

    /**
     * Delete a product
     * @param {string} id 
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Method not implemented.');
    }
}
