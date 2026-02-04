import Transaction from "../models/transaction.js";
import User from "../models/user.js"
export const ErrorMessage = (status,message)=>{
    const error = new Error();
    error.status = status;
    error.message = message;
    return error;
}

export const addTransaction = async(req,res)=>{
    const {type,amount,currency,category,desc,date,userId}=req.body
    console.log(req.body);
    const transaction = Transaction({
        userId,
        type,
        amount,
        currency,
        category,
        desc,
        date
    })

    try{
        await transaction.save()
        res.status(200).json({transaction})

    }catch(err){
        res.status(500).json({message:'Server error'})
        console.log(err)
    }
    console.log(transaction)
}

export const getTransactions=async(req,res)=>{
    const userId= req.params.userId;
    try{
        const trans = await Transaction.find({userId:userId})
        .sort({ date: -1 }) // Sort by date in descending order
        .exec();
        res.json({trans})
    }catch(err){
        res.json({message:"No transactions found"})
    }
}


export const editTransaction=async(req,res)=>{
    try{
      console.log(req.body)
      console.log(req.params.id)
        const tran = await Transaction.findById(req.params.id);
        if(!tran){
            return next(createError(404,"Transaction not found"));
        }
            const newtran = await Transaction.findByIdAndUpdate(req.params.id,{
                $set:req.body.transInput
            },{new:true});
            console.log("Updated document:", newtran);
            res.json(newtran)
    }catch(err){
        res.status(400).json("unable to edit transaction");
    }
}

export const deleteTransaction=async(req,res)=>{
    try{
        const tran = await Transaction.findById(req.params.id);
        if(!tran){
            return next(createError(404,"Transaction not found"));
        }
            await Transaction.findByIdAndDelete(req.params.id);
            res.status(200).json("Transaction removed");

    }catch(err){
        res.status(200).json("unable to delete transaction");
        console.log(err)
    }
}

export const getTransactionsByFilter = async(req,res)=>{
    console.log(req.body)
    const {userId,category,startDate,endDate} = req.body.filterInput
    try {
        let filter = { userId: userId };
    
        if (req.body.filterInput.category !== '') {
          filter.category = category;
        }
    
        if (startDate && endDate) {
          filter.date = {
            $gte: new Date(startDate+"T00:00:00.000+00:00"),
            $lte: new Date(endDate+"T23:59:59.999+00:00"),
          };
        }

        console.log("filter",filter)
        const trans = await Transaction.find(filter)
        .sort({ date: -1 }) // Sort by date in descending order
        .exec();
        console.log("trans",trans)
    
        res.json({ trans });
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
   
}

//correct this api first---->
export const getTotalStats=async(req,res)=>{
    const userId = req.params.userId
    console.log("user:",userId)
    try{
         // Calculate total income
         const incomeResult = await Transaction.aggregate([
            {
                $match: {
                    userId: userId,
                    type: 'income'
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$amount' }
                }
            }
        ]);

        // Calculate total expenses
        const expenseResult = await Transaction.aggregate([
            {
                $match: {
                    userId: userId,
                    type: 'expense'
                }
            },
            {
                $group: {
                    _id: null,
                    totalExpense: { $sum: '$amount' }
                }
            }
        ]);

        const totalIncome = incomeResult.length > 0 ? Math.floor(incomeResult[0].totalIncome) : 0;
        const totalExpense = expenseResult.length > 0 ? Math.floor(expenseResult[0].totalExpense) : 0;
        const balance = totalIncome - totalExpense;

        res.json({ totalIncome, totalExpense, balance });
    }catch(err){
        res.json({message:"No stats found"})
    }
}
export const getWeeklyTransaction = async (req, res) => {
  const userId = req.params.userId;

  try {
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    // Ensure both dates are in UTC to avoid timezone issues
    const utcCurrentDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
    const utcSevenDaysAgo = new Date(Date.UTC(sevenDaysAgo.getUTCFullYear(), sevenDaysAgo.getUTCMonth(), sevenDaysAgo.getUTCDate()));

    const weeklyData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: utcSevenDaysAgo, $lte: utcCurrentDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
      {
        $project: {
          date: '$_id',
          totalIncome: 1,
          totalExpense: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 }, // Sort by date in ascending order
      },
    ]);

    res.json({ weeklyData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getMonthlyTransaction = async (req, res) => {
  const userId = req.params.userId;

  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: firstDayOfMonth, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$date' },
          },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
      {
        $project: {
          month: '$_id',
          totalIncome: 1,
          totalExpense: 1,
          _id: 0,
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

    res.json({ monthlyData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getYearlyTransaction = async (req, res) => {
  const userId = req.params.userId;

  try {
    const currentDate = new Date();
    const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);

    const yearlyData = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: firstDayOfYear, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y', date: '$date' },
          },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
      {
        $project: {
          year: '$_id',
          totalIncome: 1,
          totalExpense: 1,
          _id: 0,
        },
      },
      {
        $sort: { year: 1 },
      },
    ]);

    res.json({ yearlyData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getCategoryWiseTransaction = async(req,res)=>{
  const id = req.params.userId
  try{
    const categoryData = await Transaction.aggregate([
      {
        $match: {
          userId: id,
        },
      },
      {
        $group: {
          _id: { $toLower: "$category" },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
        },
      },
    ]);
    res.json(categoryData)
    

  }catch(err){
    console.log(err)
  }
}

/**
 * Add expense with split mode support
 * splitMode: 'equal' | 'custom' | 'percentage'
 * splitDetails: array of {participantId, amount/percentage}
 */
export const addExpenseWithSplit = async(req,res)=>{
    try{
        const {groupId, userId, paidBy, amount, currency, desc, date, splitMode, splitDetails} = req.body
        
        if(!groupId || !paidBy || !amount || !splitMode){
            return res.status(400).json({message: 'Missing required fields'})
        }

        // Validate and process split details
        let processedSplitDetails = []
        let totalSplit = 0
        
        if(splitMode === 'equal'){
            const splitAmount = amount / splitDetails.length
            processedSplitDetails = splitDetails.map(detail => ({
                participantId: detail.participantId,
                participantName: detail.name,
                amount: parseFloat((splitAmount).toFixed(2)),
                percentage: parseFloat((100 / splitDetails.length).toFixed(2))
            }))
            totalSplit = amount
        }
        else if(splitMode === 'custom'){
            processedSplitDetails = splitDetails.map(detail => ({
                participantId: detail.participantId,
                participantName: detail.name,
                amount: parseFloat(detail.amount.toFixed(2)),
                percentage: parseFloat((detail.amount / amount * 100).toFixed(2))
            }))
            totalSplit = splitDetails.reduce((sum, d) => sum + d.amount, 0)
        }
        else if(splitMode === 'percentage'){
            processedSplitDetails = splitDetails.map(detail => ({
                participantId: detail.participantId,
                participantName: detail.name,
                percentage: parseFloat(detail.percentage.toFixed(2)),
                amount: parseFloat((amount * detail.percentage / 100).toFixed(2))
            }))
            totalSplit = processedSplitDetails.reduce((sum, d) => sum + d.amount, 0)
        }

        // Check if total split equals amount (with rounding tolerance)
        if(Math.abs(totalSplit - amount) > 0.01){
            return res.status(400).json({message: 'Split amounts do not match total expense amount'})
        }

        const transaction = new Transaction({
            groupId,
            userId,
            paidBy,
            type: 'expense',
            amount,
            currency: currency || 'inr',
            desc,
            date: date || new Date(),
            splitMode,
            splitDetails: processedSplitDetails
        })

        await transaction.save()
        res.status(200).json({message: 'Expense added successfully', transaction})
    }catch(err){
        console.error(err)
        res.status(500).json({message: 'Error adding expense'})
    }
}

/**
 * Get expenses for a group with filtering
 */
export const getGroupExpenses = async(req,res)=>{
    try{
        const {groupId} = req.params
        const {participantId, startDate, endDate, minAmount, maxAmount} = req.query
        
        let filter = {groupId}
        
        if(participantId){
            filter.$or = [
                {paidBy: participantId},
                {'splitDetails.participantId': participantId}
            ]
        }
        
        if(startDate || endDate){
            filter.date = {}
            if(startDate) filter.date.$gte = new Date(startDate)
            if(endDate) filter.date.$lte = new Date(endDate)
        }
        
        if(minAmount || maxAmount){
            filter.amount = {}
            if(minAmount) filter.amount.$gte = parseFloat(minAmount)
            if(maxAmount) filter.amount.$lte = parseFloat(maxAmount)
        }

        const expenses = await Transaction.find(filter)
            .sort({date: -1})
            .populate('splitDetails.participantId', 'name email color avatar')
        
        res.status(200).json(expenses)
    }catch(err){
        console.error(err)
        res.status(500).json({message: 'Error fetching expenses'})
    }
}

/**
 * Update expense split details
 */
export const editExpenseSplit = async(req,res)=>{
    try{
        const {id} = req.params
        const {splitMode, splitDetails, amount} = req.body
        
        let processedSplitDetails = []
        
        if(splitMode === 'equal'){
            const splitAmount = amount / splitDetails.length
            processedSplitDetails = splitDetails.map(detail => ({
                participantId: detail.participantId,
                participantName: detail.name,
                amount: parseFloat((splitAmount).toFixed(2)),
                percentage: parseFloat((100 / splitDetails.length).toFixed(2))
            }))
        }
        else if(splitMode === 'custom'){
            processedSplitDetails = splitDetails.map(detail => ({
                participantId: detail.participantId,
                participantName: detail.name,
                amount: parseFloat(detail.amount.toFixed(2)),
                percentage: parseFloat((detail.amount / amount * 100).toFixed(2))
            }))
        }
        else if(splitMode === 'percentage'){
            processedSplitDetails = splitDetails.map(detail => ({
                participantId: detail.participantId,
                participantName: detail.name,
                percentage: parseFloat(detail.percentage.toFixed(2)),
                amount: parseFloat((amount * detail.percentage / 100).toFixed(2))
            }))
        }

        const transaction = await Transaction.findByIdAndUpdate(
            id,
            {
                $set: {
                    splitMode,
                    splitDetails: processedSplitDetails
                }
            },
            {new: true}
        )

        res.status(200).json({message: 'Expense updated successfully', transaction})
    }catch(err){
        console.error(err)
        res.status(500).json({message: 'Error updating expense'})
    }
}
