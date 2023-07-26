import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "~/utils/api";
import clsx from "clsx";
import { useEffect } from "react";
import Navbar from "~/components/navbar";

const SDeliveryAddress = z.object({
  id: z.string().optional(),
  street: z.string().min(1, { message: "Required" }),
  city: z.string().min(1, { message: "Required" }),
  state: z.string().min(1, { message: "Required" }),
  zip: z.string().min(1, { message: "Required" }),
});

export default function Profile() {
  const deliveryAddressGetAllQuery = api.deliveryAddress.getAll.useQuery();
  const deliveryAddressCreateMutation =
    api.deliveryAddress.create.useMutation();
  const deliveryAddressUpdateAllMutation =
    api.deliveryAddress.updateAll.useMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof SDeliveryAddress>>({
    resolver: zodResolver(SDeliveryAddress),
  });

  const deliveryAddressId = watch("id");

  useEffect(() => {
    if (deliveryAddressGetAllQuery.data?.[0])
      reset(deliveryAddressGetAllQuery.data[0]);
  }, [deliveryAddressGetAllQuery.data]);

  const onSubmit = handleSubmit((data) => {
    if (data.id)
      deliveryAddressUpdateAllMutation.mutate([
        data as typeof data & { id: string },
      ]);
    else
      deliveryAddressCreateMutation.mutate(data, {
        onSettled: () => void deliveryAddressGetAllQuery.refetch(),
      });
  });

  return (
    <div>
      <Navbar />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(e);
        }}
        className="card m-8 w-80 bg-accent p-4 text-accent-content shadow-xl"
      >
        <div className="card-body">
          <h2 className="card-title">Delivery Address</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label htmlFor="street">Street</label>
            <input
              id="street"
              type="text"
              placeholder="100 Museum Dr"
              className={clsx("input w-full max-w-xs", {
                "input-error": errors.street,
              })}
              {...register("street")}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              placeholder="Newport News"
              className={clsx("input w-full max-w-xs", {
                "input-error": errors.city,
              })}
              {...register("city")}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="state">State</label>
            <input
              id="state"
              type="text"
              placeholder="Vermont"
              className={clsx("input w-full max-w-xs", {
                "input-error": errors.state,
              })}
              {...register("state")}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="zip">Zip</label>
            <input
              id="zip"
              type="text"
              placeholder="23601"
              className={clsx("input w-full max-w-xs", {
                "input-error": errors.zip,
              })}
              {...register("zip")}
            />
          </div>
        </div>
        <div className="card-actions justify-end">
          <button
            className="btn-primary btn mt-2"
            type="submit"
            disabled={
              deliveryAddressCreateMutation.isLoading ||
              deliveryAddressUpdateAllMutation.isLoading ||
              deliveryAddressGetAllQuery.isLoading
            }
          >
            {deliveryAddressCreateMutation.isLoading ||
            deliveryAddressUpdateAllMutation.isLoading ? (
              <span className="loading loading-spinner" />
            ) : null}
            {deliveryAddressId ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
