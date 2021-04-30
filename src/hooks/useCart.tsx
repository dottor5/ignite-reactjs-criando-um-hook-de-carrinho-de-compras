import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      const productExist = cart.find((product) => product.id === productId);

      const productAmountStock = response.data.amount;

      const currentAmount = productExist ? productExist.amount : 0;
      const amountToCart = currentAmount + 1;

      if (amountToCart > productAmountStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExist) {
        await updateProductAmount({ productId, amount: amountToCart });
      } else {
        const response = await api.get(`/products/${productId}`);

        const data = {
          ...response.data,
          amount: 1,
        };

        setCart([...cart, data]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, data])
        );
      }
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExist = cart.find((product) => product.id === productId);

      if (!productExist) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const productsToCart = cart.filter((product) => product.id !== productId);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(productsToCart));
      setCart(productsToCart);
    } catch {
      // TODO
      toast.error("Erro interno do servidor!");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const productExist = cart.find((product) => product.id === productId);

      if (!productExist) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      if (amount <= 0) return;

      const response = await api.get(`/stock/${productId}`);
      const productAmountStock = response.data.amount;

      if (amount > productAmountStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productsToCart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount: amount,
          };
        }

        return product;
      });

      setCart(productsToCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(productsToCart));
    } catch {
      // TODO
      toast.error("Erro interno do servidor!");
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
