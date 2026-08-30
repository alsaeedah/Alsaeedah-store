import { MutationOperation } from './ProductMutationTypes.js';

export const ProductMutationValidator = {
    validate(operation, payload) {
        if (!Object.values(MutationOperation).includes(operation)) {
            throw new Error(`Invalid mutation operation: ${operation}`);
        }

        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload must be an object.');
        }

        if (operation === MutationOperation.CREATE) {
            if (!payload.name) throw new Error('Product name is required for creation.');
            if (payload.price === undefined) throw new Error('Product price is required for creation.');
        }

        return true;
    }
};
