import ProductList from '../components/ProductList';

export default function ChildrenWatches() {
    return (
        <ProductList 
            initialCategory="kids" 
            title="ساعات" 
            subtitle="أطفال" 
            description="ساعات مرحة وعملية تناسب جميع الأعمار" 
        />
    );
}
