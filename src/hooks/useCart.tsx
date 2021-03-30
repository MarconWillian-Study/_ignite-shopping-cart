import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stockProduct } = await api.get<Stock>(`/stock/${productId}`);

      
      const indexItemInCard = cart.findIndex(item => {
        return productId === item.id
      });


      if(stockProduct.amount<=cart[indexItemInCard]?.amount){
        throw new Error("Quantidade solicitada fora de estoque");
      };

      const { data: newProduct} = await api.get<Product>(`/products/${productId}`);
      const newItem = {
        ...newProduct,
        amount: indexItemInCard === -1 ? 1 : cart[indexItemInCard].amount + 1
      }


      const newCart = [
        ...cart.filter(item => {
          return productId !== item.id
        }),
        newItem
      ];

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      setCart(newCart)
    } catch (error) {
      if(error.message === 'Quantidade solicitada fora de estoque'){
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Erro na adição do produto');
      }

    }
  };

  const removeProduct = (productId: number) => {
    try {
      
      const indexItemInCard = cart.findIndex(item => {
        return productId === item.id
      });

      if(indexItemInCard === -1){
        throw new Error('Erro na remoção do produto');
      }

      const newCart = cart.filter(product => product.id !== productId);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart)
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount===0){
        return ;
      }
      
      const indexItemInCard = cart.findIndex(item => {
        return productId === item.id
      });

      if(indexItemInCard === -1){
        throw new Error('Erro na alteração de quantidade do produto');
      }

      const { data: stockProduct } = await api.get<Stock>(`/stock/${productId}`);
      if(stockProduct.amount<=amount){
        throw new Error("Quantidade solicitada fora de estoque");
      };

      const newCart = cart.map(product => {
        return {
          ...product,
          amount: productId === product.id ? amount : product.amount
        }
      });

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart)
    } catch(error) {
      if(error.message === 'Quantidade solicitada fora de estoque'){
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
