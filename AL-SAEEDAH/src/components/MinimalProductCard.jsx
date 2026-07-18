import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MinimalProductCard = ({ product }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            onClick={() => navigate(`/product/${product.id}`)}
            className="minimal-product-card"
            whileHover="hover"
        >
            <img 
                src={product.imageUrl || product.image} 
                alt={product.name} 
                loading="lazy"
                decoding="async"
            />
            
            {/* Elegant overlay on hover */}
            <motion.div 
                className="minimal-card-overlay"
                variants={{
                    hover: { opacity: 1 }
                }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <div className="view-details-btn">
                    <ArrowLeft size={20} />
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MinimalProductCard;
