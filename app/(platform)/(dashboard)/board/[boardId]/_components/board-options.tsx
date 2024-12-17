"use client";

import { toast } from "sonner";
import { MoreHorizontal, X } from "lucide-react";

import { deleteBoard } from "@/actions/delete-board";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BoardOptionsProps {
  id: string;
}

export const BoardOptions = ({ id }: BoardOptionsProps) => {
  const { execute, isLoading } = useAction(deleteBoard, {
    onError: (error) => {
      toast.error(error);
    },
  });

  const onDelete = () => {
    execute({ id });
  };

  return (
    <Popover>
      {/* 
        Error: Hydration failed because the initial UI does not match what was rendered on the server.
        Warning: Expected server HTML to contain a matching <button> in <button>.
        ./components/ui/button.tsx (42:11)
        記得在 <PopoverTrigger> 加上 asChild ，不然會報上面的錯誤，原因是不加 asChild 的話 <PopoverTrigger> 本身也是一個 <button> ，在這是個 client component 下 client side 收到的是 
        <button>
          <button></button>
        </button>
        但是我們在 server side 渲染的卻是 <button></button>
        server side 和 client side 兩邊不一致造成 Hydration failed
        為了避免這個錯誤要在 <PopoverTrigger> 加上 asChild 讓 server side 和 client side 一樣是渲染 <button></button> ，兩邊一致就不會 Hydration failed
      */}
      <PopoverTrigger asChild>
        <Button className="h-auto w-auto p-2" variant="transparent">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="px-0 pt-3 pb-3" side="bottom" align="start">
        <div className="text-sm font-medium text-center text-neutral-600 pb-4">
          Board actions
        </div>
        <PopoverClose asChild>
          <Button
            className="h-auto w-auto p-2 absolute top-2 right-2 text-neutral-600"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>
        <Button
          variant="ghost"
          onClick={onDelete}
          disabled={isLoading}
          className="rounded-none w-full h-auto p-2 px-5 justify-start font-normal text-sm"
        >
          Delete this board
        </Button>
      </PopoverContent>
    </Popover>
  );
};
